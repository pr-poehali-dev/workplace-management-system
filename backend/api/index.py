'''
Business: API для управления производственной системой
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - object с attributes: request_id, function_name
Returns: HTTP response dict с statusCode, headers, body
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    path_params = event.get('pathParams', {})
    action = path_params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if action == 'login':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username')
            password = body.get('password')
            
            cur.execute(
                "SELECT id, username, full_name, role FROM users WHERE username = %s AND password = %s",
                (username, password)
            )
            user = cur.fetchone()
            
            if user:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(user)),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
        
        elif action == 'orders':
            if method == 'GET':
                cur.execute("""
                    SELECT o.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM orders o
                    LEFT JOIN materials m ON o.material_id = m.id
                    LEFT JOIN colors c ON o.color_id = c.id
                    LEFT JOIN users u ON o.created_by = u.id
                    ORDER BY o.created_at DESC
                """)
                orders = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(o) for o in orders], default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                cur.execute(
                    """INSERT INTO orders (material_id, size, color_id, quantity, unit, status, completed, created_by)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (body.get('material_id'), body.get('size'), body.get('color_id'),
                     body.get('quantity'), body.get('unit'), 'new', 0, body.get('created_by'))
                )
                order_id = cur.fetchone()['id']
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': order_id}),
                    'isBase64Encoded': False
                }
            
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                order_id = body.get('id')
                completed = body.get('completed')
                
                cur.execute("SELECT quantity FROM orders WHERE id = %s", (order_id,))
                order = cur.fetchone()
                
                if order:
                    quantity = float(order['quantity'])
                    completed_val = float(completed)
                    
                    if completed_val >= quantity:
                        status = 'completed'
                    elif completed_val > 0:
                        status = 'in_progress'
                    else:
                        status = 'new'
                    
                    cur.execute(
                        "UPDATE orders SET completed = %s, status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (completed, status, order_id)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
        
        elif action == 'warehouse':
            cur.execute("""
                SELECT w.*, m.name as material_name, c.name as color_name
                FROM warehouse w
                LEFT JOIN materials m ON w.material_id = m.id
                LEFT JOIN colors c ON w.color_id = c.id
                ORDER BY m.name
            """)
            items = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(i) for i in items], default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'colors':
            cur.execute("SELECT * FROM colors ORDER BY usage_count DESC")
            colors = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(c) for c in colors], default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'materials':
            cur.execute("""
                SELECT m.*, c.name as color_name, cat.name as category_name
                FROM materials m
                LEFT JOIN colors c ON m.color_id = c.id
                LEFT JOIN categories cat ON m.category_id = cat.id
                ORDER BY m.name
            """)
            materials = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(m) for m in materials], default=str),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
