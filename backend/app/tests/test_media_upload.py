import io
import struct
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.models import User
from app.deps import get_current_user

client = TestClient(app)

mock_user = User(
    id=999,
    email="tester@safechat360.com",
    username="tester",
    hashed_password="hashed_pw",
    role="user"
)

def make_test_image(format="JPEG", size=(100, 100), color="blue"):
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()

def make_test_mp4(duration_seconds):
    ftyp_data = b"isom" + struct.pack(">I", 512) + b"isomiso2"
    ftyp_box = struct.pack(">I", 8 + len(ftyp_data)) + b"ftyp" + ftyp_data

    timescale = 1000
    duration_units = int(duration_seconds * timescale)
    mvhd_payload = struct.pack(">B3sIIII", 0, b"\x00\x00\x00", 0, 0, timescale, duration_units)
    mvhd_payload += b"\x00" * 80
    mvhd_box = struct.pack(">I", 8 + len(mvhd_payload)) + b"mvhd" + mvhd_payload
    moov_box = struct.pack(">I", 8 + len(mvhd_box)) + b"moov" + mvhd_box
    return ftyp_box + moov_box


@pytest.fixture(autouse=True)
def override_user():
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_upload_valid_jpeg():
    jpeg_bytes = make_test_image(format="JPEG")
    response = client.post(
        "/api/upload",
        files={"file": ("photo.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["type"] == "image"
    assert data["filename"].endswith(".jpg")


def test_upload_valid_png():
    png_bytes = make_test_image(format="PNG")
    response = client.post(
        "/api/upload",
        files={"file": ("photo.png", png_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "image"
    assert data["filename"].endswith(".png")


def test_upload_mime_spoofing_rejected():
    fake_jpg = b"<?php echo 'malicious code'; ?>"
    response = client.post(
        "/api/upload",
        files={"file": ("exploit.jpg", fake_jpg, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "File signature mismatch" in response.json()["detail"]


def test_upload_corrupted_image_rejected():
    corrupted_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00" + b"\x00" * 30
    response = client.post(
        "/api/upload",
        files={"file": ("broken.jpg", corrupted_jpg, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Corrupted or invalid image" in response.json()["detail"]


def test_upload_oversized_file_rejected():
    large_payload = b"\xff\xd8\xff" + (b"\x00" * (10 * 1024 * 1024 + 100))
    response = client.post(
        "/api/upload",
        files={"file": ("huge.jpg", large_payload, "image/jpeg")}
    )
    assert response.status_code in (400, 413)


def test_upload_valid_mp4_duration():
    mp4_bytes = make_test_mp4(30.0)
    response = client.post(
        "/api/upload?is_story=true",
        files={"file": ("short_story.mp4", mp4_bytes, "video/mp4")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "video"
    assert data["duration"] == 30.0


def test_upload_mp4_exceeding_duration_story_rejected():
    long_mp4_bytes = make_test_mp4(75.0)
    response = client.post(
        "/api/upload?is_story=true&max_duration=60",
        files={"file": ("long_story.mp4", long_mp4_bytes, "video/mp4")}
    )
    assert response.status_code == 400
    assert "exceeds the maximum allowed limit of 60 seconds" in response.json()["detail"]


def test_upload_unauthorized():
    app.dependency_overrides.pop(get_current_user, None)
    jpeg_bytes = make_test_image(format="JPEG")
    unauth_client = TestClient(app)
    response = unauth_client.post(
        "/api/upload",
        files={"file": ("photo.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert response.status_code == 401
