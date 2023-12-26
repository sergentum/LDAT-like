import logging
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory, Response
import serial.tools.list_ports
import threading

app = Flask(__name__)
latency_data = []
logs = []
com_port_thread = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
werkzeug = logging.getLogger('werkzeug')
# werkzeug.setLevel(logging.ERROR)


def add_log_message(message):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = {
        "timestamp": timestamp,
        "message": message
    }
    logs.append(log_entry)


@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')


@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)


@app.route('/events')
def get_logs():
    return jsonify(logs)


@app.route('/get_data')
def get_data():
    global latency_data
    # logger.info("num" + str(latency_data))
    return jsonify(latency_data)


def read_com_port(port):
    errors = 0
    logger.info("read_com_port:" + port)
    if port:
        global latency_data
        baud_rate = 9600
        try:
            with serial.Serial(port, baud_rate, timeout=0.5) as ser:
                while errors < 100:
                    try:
                        com_data = ser.readline().decode('utf-8').strip()
                        # logger.info("COM:" + com_data)
                        if com_data:
                            logger.info("COM:" + com_data)
                            first_number = parse_delay_from_string(com_data)
                            # logger.info("num" + str(first_number))
                            if check_if_point_is_valid(first_number):
                                latency_data.append(first_number)
                    except Exception as e:
                        errors += 1
                        add_log_message(str(e))
                        logger.exception("Exception:")
                add_log_message("Too many errors from COM port")
        except Exception as e:
            add_log_message(str(e))
            logger.exception("Exception:")
    else:
        logger.error("Invalid COM port!")
        add_log_message("Invalid COM port!")


def parse_delay_from_string(com_string):
    return int(com_string.split()[0].split(':')[-1])


def check_if_point_is_valid(delay_time):
    return 1000 < delay_time < 100000


@app.route('/reset_data', methods=['POST'])
def reset_data():
    global latency_data
    latency_data = []
    return Response("data is cleaned up", status=200)


@app.route('/start_reading', methods=['POST'])
def start_reading():
    global com_port_thread

    selected_port = request.json['port']

    if com_port_thread and com_port_thread.is_alive():
        msg_existing = 'COM port reading already running. Will try to read existing data'
        logger.warning(msg_existing)
        add_log_message(msg_existing)
        return Response(msg_existing, status=409)

    com_port_thread = threading.Thread(target=read_com_port, args=(selected_port,))
    com_port_thread.start()
    com_port_thread.join(1)

    if com_port_thread and com_port_thread.is_alive():
        msg_existing = 'Reading started at ' + selected_port
        logger.info(msg_existing)
        add_log_message(msg_existing)
        return Response(msg_existing, status=200)
    else:
        msg_started = "Couldn't read selected port : " + selected_port
        logger.error(msg_started)
        add_log_message(msg_started)
        return Response(msg_started, status=500)


@app.route('/get_ports')
def get_ports():
    ports = [port.device for port in serial.tools.list_ports.comports()]
    msg_ports = 'Ports found:{0}'.format(', '.join(ports))
    logger.info(msg_ports)
    add_log_message(msg_ports)
    return jsonify(ports)


if __name__ == '__main__':
    # app.run(debug=True)
    app.run()
