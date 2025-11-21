import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Авторизация пользователей и управление сессиями
    Args: event с httpMethod, body для логина/пароля
    Returns: HTTP response с данными пользователя или ошибкой
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'login')
            
            if action == 'login':
                username = body.get('username', '')
                password = body.get('password', '')
                
                cursor.execute(
                    "SELECT id, username, full_name, role FROM users WHERE username = %s AND password = %s",
                    (username, password)
                )
                user = cursor.fetchone()
                
                if user:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'user': dict(user)})
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': 'Неверный логин или пароль'})
                    }
            
            elif action == 'create_user':
                user_id = event.get('headers', {}).get('X-User-Id')
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется авторизация'})
                    }
                
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                current_user = cursor.fetchone()
                
                if not current_user or current_user['role'] not in ['admin', 'manager']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недостаточно прав'})
                    }
                
                username = body.get('username')
                password = body.get('password')
                full_name = body.get('full_name')
                role = body.get('role', 'employee')
                
                cursor.execute(
                    "INSERT INTO users (username, password, full_name, role) VALUES (%s, %s, %s, %s) RETURNING id, username, full_name, role",
                    (username, password, full_name, role)
                )
                new_user = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'user': dict(new_user)})
                }
        
        elif method == 'GET':
            user_id = event.get('headers', {}).get('X-User-Id')
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            current_user = cursor.fetchone()
            
            if not current_user or current_user['role'] not in ['admin', 'manager']:
                cursor.execute(
                    "SELECT id, username, full_name, role FROM users WHERE id = %s AND role = 'employee'",
                    (user_id,)
                )
            else:
                cursor.execute(
                    "SELECT id, username, full_name, role FROM users WHERE role != 'admin' OR id = %s",
                    (user_id,)
                )
            
            users = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': [dict(u) for u in users]})
            }
        
        elif method == 'PUT':
            user_id = event.get('headers', {}).get('X-User-Id')
            body = json.loads(event.get('body', '{}'))
            target_user_id = body.get('id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'})
                }
            
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            current_user = cursor.fetchone()
            
            if not current_user or current_user['role'] not in ['admin', 'manager']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'})
                }
            
            updates = []
            params = []
            
            if 'username' in body:
                updates.append('username = %s')
                params.append(body['username'])
            if 'password' in body:
                updates.append('password = %s')
                params.append(body['password'])
            if 'full_name' in body:
                updates.append('full_name = %s')
                params.append(body['full_name'])
            if 'role' in body:
                updates.append('role = %s')
                params.append(body['role'])
            
            params.append(target_user_id)
            
            cursor.execute(
                f"UPDATE users SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, username, full_name, role",
                params
            )
            updated_user = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': dict(updated_user)})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
