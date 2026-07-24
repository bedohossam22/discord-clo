import os
import uuid
from dotenv import load_dotenv
from stream_chat import StreamChat

load_dotenv()


apiKey = os.getenv('API_KEY')
secret = os.getenv('SECRET')

server_client = StreamChat(api_Key=apiKey, api_secret=secret)

star_wars_characters = [
    {
        'name': 'Sick',
        'image_url': 'https://plus.unsplash.com/premium_photo-1668708034541-4ba9a33fae3a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
        'name': 'Necro',
        'image_url': 'https://media.istockphoto.com/id/536507269/photo/night-sky-with-bright-stars-and-blue-nebula.webp?s=2048x2048&w=is&k=20&c=7WftQRgCZzsWNTcVcWJvXbCyKp1t8sL-cQYVvSmJwWQ=',
    },
    {
        'name': 'TwistOfFate',  # Added missing comma here
        'image_url': 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?q=80&w=1959&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    }
]

for character in star_wars_characters:
    server_client.upsert_user(
        {
            "id": str(uuid.uuid4()),
            "name": character["name"],
            "image": character["image_url"],
        }
    )