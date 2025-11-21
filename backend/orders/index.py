'''
Business: Управление заявками с автоматическим изменением статуса на основе выполнения
Args: event с httpMethod (GET/POST/PUT), body для создания/обновления заявок
Returns: HTTP response с данными заявок или статусом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if method == 'GET':
                cur.execute('''
                    SELECT o.*, 
                           u.full_name as created_by_name
                    FROM t_p61217265_workplace_management.orders o
                    LEFT JOIN t_p61217265_workplace_management.users u ON o.created_by = u.id
                    ORDER BY 
                        CASE o.status 
                            WHEN 'new' THEN 1 
                            WHEN 'in_progress' THEN 2 
                            WHEN 'completed' THEN 3 
                        END,
                        o.created_at DESC
                ''')
                orders = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(o) for o in orders], default=str)
                }
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                headers = event.get('headers', {})
                user_id = headers.get('X-User-Id', headers.get('x-user-id'))
                
                cur.execute('''
                    INSERT INTO t_p61217265_workplace_management.orders (client_name, description, quantity_ordered, quantity_completed, 
                                       deadline, status, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, client_name, description, quantity_ordered, quantity_completed, 
                              deadline, status, created_at
                ''', (data['client_name'], data.get('description', ''), 
                      data['quantity_ordered'], data.get('quantity_completed', 0),
                      data.get('deadline'), 'new', user_id))
                order = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(order), default=str)
                }
            
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                params = event.get('queryStringParameters', {})
                order_id = params.get('id')
                
                new_status = data.get('status', 'new')
                quantity_completed = data.get('quantity_completed', 0)
                quantity_ordered = data.get('quantity_ordered', 1)
                
                if quantity_completed == 0:
                    new_status = 'new'
                elif quantity_completed >= quantity_ordered:
                    new_status = 'completed'
                elif quantity_completed > 0:
                    new_status = 'in_progress'
                
                cur.execute('''
                    UPDATE t_p61217265_workplace_management.orders 
                    SET client_name = %s, description = %s, quantity_ordered = %s, 
                        quantity_completed = %s, deadline = %s, status = %s
                    WHERE id = %s
                    RETURNING id, client_name, description, quantity_ordered, quantity_completed, 
                              deadline, status, created_at
                ''', (data['client_name'], data.get('description', ''), 
                      quantity_ordered, quantity_completed, data.get('deadline'), 
                      new_status, order_id))
                order = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(order) if order else {}, default=str)
                }
    
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }