import string
import sqlite3
import random
from datetime import datetime
from flask import *
from functools import wraps
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}})
# CORS(app)


def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/belay.db')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one:
            return rows[0]
        return rows
    return None


def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' +
                 'values (?, ?, ?) returning id, name, password, api_key',
                 (name, password, api_key),
                 one=True)
    return u


def new_user_sign_up(name, password):
    api_key = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' +
                 'values (?, ?, ?) returning id, name, password, api_key',
                 (name, password, api_key),
                 one=True)
    return u


# -------------------------------- API ROUTES ----------------------------------
# -------------------------------- USER ----------------------------------
@app.route('/api/login', methods=['POST'])
def login():

    if request.method == 'POST':
        name = request.json.get('user')

        password = request.json.get('pass')

        u = query_db('select * from users where name = ? and password = ?',
                     [name, password], one=True)

        if u:
            print("Success")
            return jsonify({'Success': True,
                            'user_id': u['id'],
                            'user_name': u['name'],
                            'api_key': u['api_key']})

        else:
            print("couldn't find that user")
            return jsonify({'Success': False})


@app.route('/api/signup', methods=['POST'])
def signup():
    username = request.json.get('user')
    password = request.json.get('pass')
    user = new_user_sign_up(username, password)
    if user:
        return jsonify({
            "Success": True,
            "api_key": user["api_key"],
            "user_name": user["name"],
            "user_id": user["id"]
        }), 200
    return jsonify({"Success": False, "error": "User creation failed"}), 500

# -------------------------------- CHANNELS ----------------------------------


@app.route('/api/create_channel', methods=['POST'])
# @require_api_key
def create_channel():
    data = request.get_json()
    channel_Name = data.get('channelName')

    if not channel_Name:
        return jsonify({"Success": False, "message": "Channel name is required."}), 400

    try:
        new_channel = query_db('INSERT INTO channels (name) VALUES (?) RETURNING id, name',
                               [channel_Name], one=True)
        return jsonify({"Success": True, "channel": dict(new_channel)}), 201
    except sqlite3.Error as e:
        return jsonify({"Success": False, "message": str(e)}), 500


@app.route('/api/channels', methods=['GET'])
def get_channels():
    channels = query_db('SELECT * FROM channels', args=(), one=False)
    if channels:
        list_of_channels = [{"id": channel["id"],
                             "name": channel["name"]} for channel in channels]
        return jsonify({"Success": True, "channels": list_of_channels}), 200
    else:
        return jsonify({"Success": False, "message": "No channels found"}), 404


@app.route('/api/channel/<int:channel_id>', methods=['GET'])
def get_channel(channel_id):
    channel = query_db('SELECT * FROM channels WHERE id = ?',
                       (channel_id,), one=True)
    if channel:
        return jsonify({"Success": True, "message": dict(channel)}), 200
    else:
        return jsonify({"Success": False, "message": "channel not found"}), 404

# -------------------------------- MESSAGES ----------------------------------

# POST to post a new message to a room


@app.route('/api/channels/<int:channel_id>/messages/post', methods=['POST'])
# @require_api_key
def post_channel_message(channel_id):
    data = request.get_json()
    userid = data.get('userid')
    if userid is None:
        return jsonify({'error': 'Authentication required'}), 403

    # Extracting message content from the POST request
    message_body = data.get('content')
    print("message_body: ", message_body)
    if not message_body:
        return jsonify({'error': 'Message content is required'}), 400

    # Insert message into the database
    try:
        query = """
        INSERT INTO messages (user_id, channel_id, content)
        VALUES (?, ?, ?)
        """
        query_db(query, [userid, channel_id, message_body])
        return jsonify({'Success': 'Message posted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST to post a new reply to a message
@app.route('/api/channels/<int:channel_id>/messages/<int:message_id>/reply', methods=['POST'])
# @require_api_key
def post_channel_reply(channel_id, message_id):
    data = request.get_json()
    userid = data.get('userid')
    if userid is None:
        return jsonify({'error': 'Authentication required'}), 403

    # Extracting message content from the POST request
    message_body = data.get('content')
    print("message_body: ", message_body)
    if not message_body:
        return jsonify({'error': 'Reply content is required'}), 400

    # Insert message into the database
    try:
        query = """
        INSERT INTO messages (user_id, channel_id, content, replies_to)
        VALUES (?, ?, ?, ?)
        """
        query_db(query, [userid, channel_id, message_body, message_id])
        return jsonify({'Success': 'Reply posted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/channels/<int:channel_id>/messages', methods=['GET'])
def get_channel_messages(channel_id):
    query = """
    SELECT m.id, m.content, u.name as author, m.channel_id,
           (SELECT COUNT(*) FROM messages WHERE replies_to = m.id) as replies_count,
           GROUP_CONCAT(r.emoji) as emojis
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN reactions r ON m.id = r.message_id
    WHERE m.channel_id = ? AND m.replies_to IS NULL
    GROUP BY m.id
    ORDER BY m.id ASC;
    """
    try:
        messages = query_db(query, [channel_id], one=False)
        messages_list = [{
            "id": row['id'],
            "content": row['content'],
            "author": row['author'],
            "channel_id": row['channel_id'],
            "replies_count": row['replies_count'],
            "emojis": row['emojis'].split(',') if row['emojis'] else []
        } for row in messages]
        # print("messages_list: ", messages_list)
        return jsonify({"Success": True, "message": messages_list})
    except Exception as e:
        return jsonify({"Success": False, 'error': str(e)}), 500


@app.route('/api/channels/<int:channel_id>/messages/<int:message_id>/get', methods=['GET'])
def get_channel_reply(channel_id, message_id):
    query = """
    SELECT m.id, m.content, u.name as author, m.channel_id,
        GROUP_CONCAT(r.emoji) as emojis
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN reactions r ON m.id = r.message_id
    WHERE m.channel_id = ? AND m.replies_to = ?
    GROUP BY m.id
    ORDER BY m.id ASC;
    """
    try:
        replies = query_db(query, [channel_id, message_id])

        replies_list = [{
            "id": row['id'],
            "content": row['content'],
            "author": row['author'],
            "channel_id": row['channel_id'],
            "emojis": row['emojis'].split(',') if row['emojis'] else []
        } for row in replies]
        print("replies_list: ", replies_list)
        return jsonify({"Success": True, "replies": replies_list})
    except Exception as e:
        return jsonify({"Success": False, 'error': str(e)}), 500


@app.route('/api/messages/<int:message_id>', methods=['GET'])
def get_message(message_id):
    query = """
    SELECT m.id, m.content, u.name as author, m.channel_id
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ? 
    """
    try:
        db = get_db()
        cur = db.execute(query, (message_id,))
        message = cur.fetchone()

        message = dict(message)
        print("messages_list: ", message)

        return jsonify({"Success": True, "message": message})
    except Exception as e:
        return jsonify({"Success": False, 'error': str(e)}), 500


# -------------------------------- EMOJI ----------------------------------
@ app.route('/api/reactions/post', methods=['POST'])
def track_reaction():
    data = request.get_json()
    user_id = data.get('user_id')
    if user_id is None:
        return jsonify({'error': 'Authentication required'}), 403
    message_id = data.get('message_id')
    emoji = data.get('emoji')
    if emoji is None:
        return jsonify({'error': 'Emoji required'}), 400

    query = """
    INSERT INTO reactions (emoji, user_id, message_id)
    VALUES (?, ?, ?)
    """
    try:
        query_db(query, [emoji, user_id, message_id])
        return jsonify({'Success': 'Reaction posted successfully'}), 201
    except Exception as e:
        return jsonify({"Success": False, "error": str(e)}), 500


# -------------------------------- API RUN ----------------------------------
app.run(host='127.0.0.1', port=5000, debug=True)
