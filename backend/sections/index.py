import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление разделами и подразделами материалов
    Args: event с httpMethod, body для создания/редактирования разделов
    Returns: HTTP response с данными разделов
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
                SELECT s.*, p.name as parent_name
                FROM sections s
                LEFT JOIN sections p ON s.parent_id = p.id
                ORDER BY COALESCE(s.parent_id, s.id), s.id
            """)
            
            sections = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'sections': [dict(s) for s in sections]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            parent_id = body.get('parent_id')
            
            cursor.execute(
                "INSERT INTO sections (name, parent_id) VALUES (%s, %s) RETURNING id, name, parent_id",
                (name, parent_id)
            )
            section = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'section': dict(section)}, ensure_ascii=False)
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            section_id = body.get('id')
            
            updates = []
            params = []
            
            if 'name' in body:
                updates.append('name = %s')
                params.append(body['name'])
            if 'parent_id' in body:
                updates.append('parent_id = %s')
                params.append(body['parent_id'])
            
            params.append(section_id)
            
            cursor.execute(
                f"UPDATE sections SET {', '.join(updates)} WHERE id = %s RETURNING id, name, parent_id",
                params
            )
            section = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'section': dict(section)}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
