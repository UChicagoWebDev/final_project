import string
import sqlite3
import random
from datetime import datetime
from flask import *

from functools import wraps
from flask_cors import CORS
import os

app = Flask(__name__)
# app = Flask(__name__, static_folder='react/build', static_url_path='')

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

# -------------------------------- ROUTES ----------------------------------
# try to use flask run run two servers

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def serve(path):
#     if path != "" and os.path.exists(app.static_folder + '/' + path):
#         return send_from_directory(app.static_folder, path)
#     else:
#         return send_from_directory(app.static_folder, 'index.html')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        print("path exists")
        return send_from_directory(app.static_folder, path)
    else:
        print("index.html")
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/')
@app.route('/login')
@app.route('/home')
@app.route('/profile')
@app.route('/createChannel')
@app.route('/channel/<chat_id>')
@app.route('/channel/<chat_id>/message/<message_id>')
def index(chat_id=None, message_id=None):
    return app.send_static_file('index.html')

# -------------------------------- API ROUTES ----------------------------------
# -------------------------------- API REQUIREMENT ----------------------------------

# TODO: Create the API


def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Or however you choose to send the API key
        api_key = request.headers.get('X-API-Key')
        if api_key and query_db('SELECT * FROM users WHERE api_key = ?', (api_key,), one=True):
            return f(*args, **kwargs)
        else:
            return jsonify({"success": False, "message": "Invalid or missing API key."}), 401
    return decorated_function

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


@app.route('/api/update_username', methods=['POST'])
@require_api_key
def update_username():
    data = request.get_json()
    api_key = data.get('api_key')
    new_name = data.get('new_name')

    # Validate input
    if not api_key or not new_name:
        return jsonify({"success": False, "message": "API key and new name are required."}), 400

    # Find the user by API key
    user = query_db('SELECT * FROM users WHERE api_key = ?',
                    (api_key,), one=True)
    if user:
        try:
            query_db('UPDATE users SET name = ? WHERE api_key = ?',
                     (new_name, api_key))
            return jsonify({"success": True, "message": "Username updated successfully."}), 200
        except sqlite3.Error as e:
            return jsonify({"success": False, "message": "Database error occurred."}), 500
    else:
        return jsonify({"success": False, "message": "Invalid API key."}), 404


@app.route('/api/update_password', methods=['POST'])
@require_api_key
def update_password():
    data = request.get_json()
    api_key = data.get('api_key')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    # Validate input
    if not api_key or not new_password or not confirm_password:
        return jsonify({"success": False, "message": "API key, new password, and confirm password are required."}), 400

    if new_password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match."}), 400

    # Find the user by API key
    user = query_db('SELECT * FROM users WHERE api_key = ?',
                    (api_key,), one=True)
    if user:
        try:
            query_db('UPDATE users SET password = ? WHERE api_key = ?',
                     (new_password, api_key))
            return jsonify({"success": True, "message": "Password updated successfully."}), 200
        except sqlite3.Error as e:
            return jsonify({"success": False, "message": "Database error occurred."}), 500
    else:
        return jsonify({"success": False, "message": "Invalid API key."}), 404

# -------------------------------- CHANNELS ----------------------------------


@app.route('/api/create_channel', methods=['POST'])
@require_api_key
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
@require_api_key
def post_channel_message(channel_id):
    data = request.get_json()
    userid = data.get('userid')
    if userid is None:
        return jsonify({'error': 'Authentication required'}), 403

    # Extracting message content from the POST request
    message_body = data.get('content')
    # print("message_body: ", message_body)
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
@require_api_key
def post_channel_reply(channel_id, message_id):
    data = request.get_json()
    userid = data.get('userid')
    if userid is None:
        return jsonify({'error': 'Authentication required'}), 403

    # Extracting message content from the POST request
    message_body = data.get('content')
    # print("message_body: ", message_body)
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
        # print("replies_list: ", replies_list)
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
        # print("messages_list: ", message)

        return jsonify({"Success": True, "message": message})
    except Exception as e:
        return jsonify({"Success": False, 'error': str(e)}), 500


# -------------------------------- UNREAD MESSAGES ----------------------------------

@app.route('/api/channels/<int:channel_id>/messages/<int:max_id>/mark_seen', methods=['POST'])
@require_api_key
def mark_message_as_seen(channel_id, max_id):
    data = request.get_json()
    user_id = data.get('user_id')
    if user_id is None:
        return jsonify({'error': 'User ID required'}), 400

    try:
        # Check if there's already a seen message for this user and channel
        seen_message = query_db('SELECT * FROM seen_messages WHERE user_id = ? AND channel_id = ?',
                                [user_id, channel_id], one=True)

        if seen_message:
            # Update the existing seen message record
            query_db('UPDATE seen_messages SET latest_message_id = ?, time_seen = CURRENT_TIMESTAMP WHERE user_id = ? AND channel_id = ?',
                     [max_id, user_id, channel_id])
        else:
            # Insert a new seen message record
            query_db('INSERT INTO seen_messages (user_id, channel_id, latest_message_id) VALUES (?, ?, ?)',
                     [user_id, channel_id, max_id])

        return jsonify({'Success': True, 'message': 'Last read message updated'}), 200

    except sqlite3.Error as e:
        return jsonify({'Success': False, 'error': str(e)}), 500


@app.route('/api/users/<int:user_id>/unread_message_counts', methods=['GET'])
def get_unread_message_counts(user_id):
    query = """
    SELECT 
        c.id as channel_id, 
        c.name as channel_name, 
        COALESCE(SUM(CASE WHEN m.id > IFNULL(sm.latest_message_id, 0) THEN 1 ELSE 0 END), 0) as unread_message_count
    FROM channels c
    LEFT JOIN messages m ON c.id = m.channel_id
    LEFT JOIN (
        SELECT 
            latest_message_id, 
            channel_id 
        FROM seen_messages 
        WHERE user_id = ?
    ) sm ON sm.channel_id = c.id
    GROUP BY c.id;

    """
    try:
        # print("before query")
        unread_message_counts = query_db(query, [user_id])
        # print("unread_message_counts", unread_message_counts)
        unread_counts = [{
            "channel_id": row['channel_id'],
            "channel_name": row['channel_name'],
            "unread_message_count": row['unread_message_count']
        } for row in unread_message_counts]
        # print("unread_counts: ", unread_counts)
        return jsonify({"Success": True, "unread_message_counts": unread_counts})
    except Exception as e:
        return jsonify({"Success": False, "error": str(e)}), 500


# -------------------------------- EMOJI ----------------------------------
@ app.route('/api/reactions/post', methods=['POST'])
@require_api_key
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


@app.route('/api/reactions/<int:message_id>/<emoji>', methods=['GET'])
def get_reaction_users(message_id, emoji):
    query = """
    SELECT u.name
    FROM reactions r
    JOIN users u ON r.user_id = u.id
    WHERE r.message_id = ? AND r.emoji = ?
    """
    try:
        users = query_db(query, [message_id, emoji], one=False)
        user_names = [user['name'] for user in users]
        return jsonify({"Success": True, "users": user_names})
    except Exception as e:
        return jsonify({"Success": False, "error": str(e)}), 500


# -------------------------------- API RUN ----------------------------------
# app.run(host='127.0.0.1', port=5000, debug=True)

# if __name__ == '__main__':
#     app.run(host='127.0.0.1', port=5000, debug=True)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False)

    # app.run(host='0.0.0.0', port=8000, debug=True, use_reloader=False)
