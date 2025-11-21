'''
Business: Управление каталогом цветов с отслеживанием использования
Args: event с httpMethod (GET/POST/DELETE), body для создания
Returns: HTTP response с данными цветов или статусом операции
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
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
                    SELECT c.id, c.name, c.hex_code, c.created_at, 
                           COUNT(m.id) as usage_count
                    FROM t_p61217265_workplace_management.colors c
                    LEFT JOIN t_p61217265_workplace_management.materials m ON c.id = m.color_id
                    GROUP BY c.id, c.name, c.hex_code, c.created_at
                    ORDER BY COUNT(m.id) DESC, c.name
                ''')
                colors = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(c) for c in colors], default=str)
                }
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                cur.execute('''
                    INSERT INTO t_p61217265_workplace_management.colors (name, hex_code)
                    VALUES (%s, %s)
                    RETURNING id, name, hex_code
                ''', (data['name'], data.get('hex_code', '#808080')))
                color = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(color), default=str)
                }
            
            elif method == 'DELETE':
                params = event.get('queryStringParameters', {})
                color_id = params.get('id')
                cur.execute('DELETE FROM t_p61217265_workplace_management.colors WHERE id = %s', (color_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
    
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }