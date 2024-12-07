from flask import Flask, Request
from server import app

def handler(request: Request):
    """Handle incoming requests"""
    with app.request_context(request):
        return app.handle_request()