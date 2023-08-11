import os
import json
import requests
from tqdm import tqdm  # Import tqdm for progress bars
import shutil

# Set your Discord bot token and channel ID
BOT_TOKEN = "MzM1MTY2NDg2NTg5MjEwNjI0.GIzDLo.udz0R2fQWW-pMuglM89lcr0BaS5eEi4KCdp1R4"
CHANNEL_ID = "1139466525942747187"
UPLOAD_LIMIT = 500 * 1024 * 1024  # 500 MB in bytes


# Function to recursively search for video file and metadata
def find_video_and_metadata(folder_path):
    videos = []

    for root, _, files in os.walk(folder_path):
        for filename in files:
            video_file = None
            if filename.endswith(".json"):
                metadata_file_path = os.path.join(root, filename)

                for file in files:
                    if (
                        file.endswith(".mp4")
                        or file.endswith(".mkv")
                        or file.endswith("avi")
                        or file.endswith("flv")
                        or file.endswith("wmv")
                        or file.endswith("mov")
                        or file.endswith("mpg")
                        or file.endswith("mpeg")
                        or file.endswith("m4v")
                        or file.endswith("webm")
                        or file.endswith("vob")
                        or file.endswith("ogv")
                        or file.endswith("ogg")
                        or file.endswith("gifv")
                        or file.endswith("m2v")
                        or file.endswith("3gp")
                        or file.endswith("3g2")
                        or file.endswith("mxf")
                        or file.endswith("roq")
                        or file.endswith("nsv")
                        or file.endswith("f4v")
                        or file.endswith("f4p")
                        or file.endswith("f4a")
                        or file.endswith("f4b")
                    ):
                        video_file = os.path.join(root, file)
                        break

                if video_file:
                    with open(metadata_file_path, "r") as metadata_file:
                        metadata = json.load(metadata_file)
                    videos.append(
                        {
                            "video_file": video_file,
                            "metadata": metadata,
                            "folder": os.path.dirname(video_file),
                        }
                    )

    return videos


# Function to upload video to Discord
def upload_to_discord(video_file, metadata):
    if not video_file:
        print("Video file not found.")
        return

    headers = {"Authorization": f"{BOT_TOKEN}"}

    files = {"file": ("video.mp4", open(video_file, "rb"))}

    payload = {"content": metadata.get("title", "No Title")}
    # print("uploading video: " + metadata.get("title", "No Title"))
    response = requests.post(
        f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages",
        headers=headers,
        files=files,
        data=payload,
    )

    if response.status_code == 200:
        print("Video uploaded successfully.")
    else:
        print("Failed to upload video.")


if __name__ == "__main__":
    folder_path = "videos"
    videos = find_video_and_metadata(folder_path)

    for video_data in tqdm(videos, desc="Uploading videos", unit="video"):
        try:
            video_file = video_data["video_file"]
            metadata = video_data["metadata"]
            video_folder = video_data["folder"]

            if os.path.getsize(video_file) > UPLOAD_LIMIT:
                # Move the video folder to the 'failed' folder
                failed_folder = os.path.join(folder_path, "failed")
                if not os.path.exists(failed_folder):
                    os.makedirs(failed_folder)
                failed_path = os.path.join(
                    failed_folder, os.path.basename(video_folder)
                )
                shutil.move(video_folder, failed_path)
                print(
                    f"Video '{os.path.basename(video_folder)}' exceeded upload limit and was moved to 'failed' folder."
                )
                continue

            upload_to_discord(video_file, metadata)

            # Remove the entire video folder after successful upload
            shutil.rmtree(video_folder)
            print(f"Uploaded and removed folder: '{os.path.basename(video_folder)}'")
        except Exception as e:
            print(f"Failed to upload video: {e}")
            pass
