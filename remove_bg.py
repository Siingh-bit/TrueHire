from PIL import Image
import sys

def remove_checkerboard(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        # If the pixel is very light and roughly grayscale (checkerboard/white)
        # White is 255,255,255. Checkerboard grey is usually around 204,204,204 or 240,240,240
        if r > 180 and g > 180 and b > 180 and abs(r - g) < 25 and abs(g - b) < 25:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_checkerboard("public/logo.png", "public/logo.png")
    print("Background removed successfully.")
