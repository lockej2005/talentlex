from flask import Flask, Request
from server import app

def handler(request):
    """Handle serverless requests"""
    return app