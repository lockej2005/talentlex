from flask import Request
from server import app

def handler(request: Request):
    """Handle serverless requests"""
    return app