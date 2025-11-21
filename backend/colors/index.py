import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление каталогом цветов с учетом частоты использования
    Args: event с httpMethod, body для создания/редактирования цветов
    Returns: HTTP response с данными цветов
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
            cursor.execute("""
                SELECT * FROM colors 
                ORDER BY usage_count DESC, name
            """)
            
            colors = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'colors': [dict(c) for c in colors]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            
            cursor.execute(
                "INSERT INTO colors (name) VALUES (%s) RETURNING id, name, usage_count",
                (name,)
            )
            color = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'color': dict(color)}, ensure_ascii=False)
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            color_id = body.get('id')
            
            updates = []
            params = []
            
            if 'name' in body:
                updates.append('name = %s')
                params.append(body['name'])
            
            params.append(color_id)
            
            cursor.execute(
                f"UPDATE colors SET {', '.join(updates)} WHERE id = %s RETURNING id, name, usage_count",
                params
            )
            color = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'color': dict(color)}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
