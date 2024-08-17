# Use the official Python image with the specific version you want
FROM python:3.10.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY api/negotiate/requirements.txt /app/negotiate/requirements.txt
COPY api/create_application/requirements.txt /app/create_application/requirements.txt
COPY api/submit_application/requirements.txt /app/submit_application/requirements.txt

# Install the dependencies for each backend service
RUN pip install --no-cache-dir -r /app/negotiate/requirements.txt
RUN pip install --no-cache-dir -r /app/create_application/requirements.txt
RUN pip install --no-cache-dir -r /app/submit_application/requirements.txt

# Copy the application code
COPY api/negotiate /app/negotiate
COPY api/create_application /app/create_application
COPY api/submit_application /app/submit_application

# Set the default command to run your server
# Adjust this to the entry point of your application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "negotiate.index:app", "create_application.index:app", "submit_application.index:app"]
