import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление отправкой готовой продукции
    Args: event с httpMethod, body для отправки заявок
    Returns: HTTP response с данными отправок
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            status = params.get('status')
            
            if status:
                cursor.execute("""
                    SELECT s.*, o.quantity_requested, m.name as material_name, c.name as color_name
                    FROM shipments s
                    LEFT JOIN orders o ON s.order_id = o.id
                    LEFT JOIN materials m ON o.material_id = m.id
                    LEFT JOIN colors c ON o.color_id = c.id
                    WHERE s.status = %s
                    ORDER BY s.created_at DESC
                """, (status,))
            else:
                cursor.execute("""
                    SELECT s.*, o.quantity_requested, m.name as material_name, c.name as color_name
                    FROM shipments s
                    LEFT JOIN orders o ON s.order_id = o.id
                    LEFT JOIN materials m ON o.material_id = m.id
                    LEFT JOIN colors c ON o.color_id = c.id
                    ORDER BY s.created_at DESC
                """)
            
            shipments = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'shipments': [dict(s) for s in shipments]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'create')
            user_id = event.get('headers', {}).get('X-User-Id')
            
            if action == 'prepare_from_order':
                order_id = body.get('order_id')
                
                cursor.execute("SELECT * FROM orders WHERE id = %s AND status = 'completed'", (order_id,))
                order = cursor.fetchone()
                
                if not order:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена или не завершена'})
                    }
                
                cursor.execute(
                    "INSERT INTO shipments (order_id, quantity, unit, status, created_by) VALUES (%s, %s, %s, 'ready', %s) RETURNING *",
                    (order_id, order['quantity_completed'], order['unit'], user_id)
                )
                shipment = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'shipment': dict(shipment)}, ensure_ascii=False)
                }
            
            elif action == 'ship':
                shipment_id = body.get('shipment_id')
                
                cursor.execute(
                    "UPDATE shipments SET status = 'shipped', shipped_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                    (shipment_id,)
                )
                shipment = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'shipment': dict(shipment)}, ensure_ascii=False)
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            shipment_id = body.get('id')
            
            updates = []
            params = []
            
            if 'quantity' in body:
                updates.append('quantity = %s')
                params.append(body['quantity'])
            
            params.append(shipment_id)
            
            cursor.execute(
                f"UPDATE shipments SET {', '.join(updates)} WHERE id = %s RETURNING *",
                params
            )
            shipment = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'shipment': dict(shipment)}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
