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
            
            elif method == 'DELETE':
                query_params = event.get('queryStringParameters', {})
                order_id = query_params.get('id')
                
                if order_id:
                    cur.execute("UPDATE orders SET status = 'new', completed = 0 WHERE id = %s", (order_id,))
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
        
        elif action == 'incoming':
            if method == 'GET':
                cur.execute("""
                    SELECT i.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM incoming i
                    LEFT JOIN materials m ON i.material_id = m.id
                    LEFT JOIN colors c ON i.color_id = c.id
                    LEFT JOIN users u ON i.created_by = u.id
                    ORDER BY i.created_at DESC
                """)
                items = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(i) for i in items], default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                material_id = body.get('material_id')
                color_id = body.get('color_id')
                quantity = body.get('quantity')
                unit = body.get('unit')
                created_by = body.get('created_by')
                
                cur.execute(
                    """INSERT INTO incoming (material_id, color_id, quantity, unit, created_by)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (material_id, color_id, quantity, unit, created_by)
                )
                incoming_id = cur.fetchone()['id']
                
                cur.execute(
                    """SELECT * FROM warehouse 
                       WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))""",
                    (material_id, color_id, color_id)
                )
                warehouse_item = cur.fetchone()
                
                if warehouse_item:
                    cur.execute(
                        """UPDATE warehouse SET quantity = quantity + %s, updated_at = CURRENT_TIMESTAMP
                           WHERE id = %s""",
                        (quantity, warehouse_item['id'])
                    )
                else:
                    cur.execute(
                        """INSERT INTO warehouse (material_id, color_id, quantity, unit)
                           VALUES (%s, %s, %s, %s)""",
                        (material_id, color_id, quantity, unit)
                    )
                
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': incoming_id}),
                    'isBase64Encoded': False
                }
        
        elif action == 'defects':
            if method == 'GET':
                cur.execute("""
                    SELECT d.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM defects d
                    LEFT JOIN materials m ON d.material_id = m.id
                    LEFT JOIN colors c ON d.color_id = c.id
                    LEFT JOIN users u ON d.created_by = u.id
                    ORDER BY d.created_at DESC
                """)
                items = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(i) for i in items], default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                material_id = body.get('material_id')
                color_id = body.get('color_id')
                quantity = body.get('quantity')
                unit = body.get('unit')
                reason = body.get('reason', '')
                created_by = body.get('created_by')
                
                cur.execute(
                    """SELECT * FROM warehouse 
                       WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))""",
                    (material_id, color_id, color_id)
                )
                warehouse_item = cur.fetchone()
                
                if warehouse_item and float(warehouse_item['quantity']) >= float(quantity):
                    cur.execute(
                        """UPDATE warehouse SET quantity = quantity - %s, updated_at = CURRENT_TIMESTAMP
                           WHERE id = %s""",
                        (quantity, warehouse_item['id'])
                    )
                    
                    cur.execute(
                        """INSERT INTO defects (material_id, color_id, quantity, unit, reason, created_by)
                           VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                        (material_id, color_id, quantity, unit, reason, created_by)
                    )
                    defect_id = cur.fetchone()['id']
                    
                    conn.commit()
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'id': defect_id}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient quantity in warehouse'}),
                        'isBase64Encoded': False
                    }
            
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                defect_id = body.get('id')
                
                cur.execute(
                    """UPDATE defects SET status = 'disposed' WHERE id = %s""",
                    (defect_id,)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif action == 'colors':
            if method == 'GET':
                cur.execute("SELECT * FROM colors ORDER BY usage_count DESC")
                colors = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(c) for c in colors], default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                cur.execute(
                    "INSERT INTO colors (name, hex_code, usage_count) VALUES (%s, %s, 0) RETURNING id",
                    (body.get('name'), body.get('hex_code'))
                )
                color_id = cur.fetchone()['id']
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': color_id}),
                    'isBase64Encoded': False
                }
            
            elif method == 'DELETE':
                query_params = event.get('queryStringParameters', {})
                color_id = query_params.get('id')
                
                if color_id:
                    cur.execute("UPDATE colors SET usage_count = 0 WHERE id = %s", (color_id,))
                    conn.commit()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
        
        elif action == 'materials':
            if method == 'GET':
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
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                cur.execute(
                    "INSERT INTO materials (name, category_id, color_id) VALUES (%s, %s, %s) RETURNING id",
                    (body.get('name'), body.get('category_id'), body.get('color_id'))
                )
                material_id = cur.fetchone()['id']
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': material_id}),
                    'isBase64Encoded': False
                }
            
            elif method == 'DELETE':
                query_params = event.get('queryStringParameters', {})
                material_id = query_params.get('id')
                
                if material_id:
                    cur.execute("UPDATE materials SET color_id = NULL WHERE id = %s", (material_id,))
                    conn.commit()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
        
        elif action == 'categories':
            if method == 'GET':
                cur.execute("SELECT * FROM categories ORDER BY name")
                categories = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(c) for c in categories], default=str),
                    'isBase64Encoded': False
                }
        
        elif action == 'shipments':
            if method == 'GET':
                cur.execute("""
                    SELECT s.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM shipments s
                    LEFT JOIN materials m ON s.material_id = m.id
                    LEFT JOIN colors c ON s.color_id = c.id
                    LEFT JOIN users u ON s.created_by = u.id
                    ORDER BY s.created_at DESC
                """)
                shipments = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(s) for s in shipments], default=str),
                    'isBase64Encoded': False
                }
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                material_id = body.get('material_id')
                color_id = body.get('color_id')
                quantity = body.get('quantity')
                unit = body.get('unit')
                recipient = body.get('recipient')
                address = body.get('address')
                tracking = body.get('tracking', '')
                created_by = body.get('created_by')
                
                cur.execute(
                    """SELECT * FROM warehouse 
                       WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))""",
                    (material_id, color_id, color_id)
                )
                warehouse_item = cur.fetchone()
                
                if warehouse_item and float(warehouse_item['quantity']) >= float(quantity):
                    cur.execute(
                        """UPDATE warehouse SET quantity = quantity - %s, updated_at = CURRENT_TIMESTAMP
                           WHERE id = %s""",
                        (quantity, warehouse_item['id'])
                    )
                    
                    cur.execute(
                        """INSERT INTO shipments (material_id, color_id, quantity, unit, recipient, address, tracking, status, created_by)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (material_id, color_id, quantity, unit, recipient, address, tracking, 'pending', created_by)
                    )
                    shipment_id = cur.fetchone()['id']
                    
                    conn.commit()
                    return {
                        'statusCode': 201,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'id': shipment_id}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient quantity in warehouse'}),
                        'isBase64Encoded': False
                    }
            
            elif method == 'PUT':
                body = json.loads(event.get('body', '{}'))
                shipment_id = body.get('id')
                
                update_fields = []
                update_values = []
                
                if 'status' in body:
                    update_fields.append('status = %s')
                    update_values.append(body['status'])
                if 'tracking' in body:
                    update_fields.append('tracking = %s')
                    update_values.append(body['tracking'])
                if 'recipient' in body:
                    update_fields.append('recipient = %s')
                    update_values.append(body['recipient'])
                if 'address' in body:
                    update_fields.append('address = %s')
                    update_values.append(body['address'])
                if 'quantity' in body:
                    update_fields.append('quantity = %s')
                    update_values.append(body['quantity'])
                
                if update_fields:
                    update_values.append(shipment_id)
                    query = f"UPDATE shipments SET {', '.join(update_fields)} WHERE id = %s"
                    cur.execute(query, update_values)
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif method == 'DELETE':
                query_params = event.get('queryStringParameters', {})
                shipment_id = query_params.get('id')
                
                if shipment_id:
                    cur.execute("SELECT * FROM shipments WHERE id = %s", (shipment_id,))
                    shipment = cur.fetchone()
                    
                    if shipment:
                        cur.execute(
                            """SELECT * FROM warehouse 
                               WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))""",
                            (shipment['material_id'], shipment['color_id'], shipment['color_id'])
                        )
                        warehouse_item = cur.fetchone()
                        
                        if warehouse_item:
                            cur.execute(
                                """UPDATE warehouse SET quantity = quantity + %s, updated_at = CURRENT_TIMESTAMP
                                   WHERE id = %s""",
                                (shipment['quantity'], warehouse_item['id'])
                            )
                        else:
                            cur.execute(
                                """INSERT INTO warehouse (material_id, color_id, quantity, unit)
                                   VALUES (%s, %s, %s, %s)""",
                                (shipment['material_id'], shipment['color_id'], shipment['quantity'], shipment['unit'])
                            )
                        
                        cur.execute("DELETE FROM shipments WHERE id = %s", (shipment_id,))
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'success': True}),
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