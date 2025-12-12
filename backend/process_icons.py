from PIL import Image, ImageOps
import sys
import os

from PIL import Image, ImageOps, ImageDraw
import sys
import os

def find_components(binary_img, min_area=500):
    width, height = binary_img.size
    pixels = binary_img.load()
    visited = set()
    components = []
    
    # 8-connected neighbors
    neighbors = [(-1, -1), (0, -1), (1, -1), 
                 (-1, 0),           (1, 0), 
                 (-1, 1),  (0, 1),  (1, 1)]

    for y in range(height):
        for x in range(width):
            # 0 is black (content), 255 is white (background)
            if pixels[x, y] == 0 and (x, y) not in visited:
                # Found new component, start flood fill
                q = [(x, y)]
                visited.add((x, y))
                min_x, max_x = x, x
                min_y, max_y = y, y
                count = 0
                
                head = 0
                while head < len(q):
                    cx, cy = q[head]
                    head += 1
                    count += 1
                    
                    min_x = min(min_x, cx)
                    max_x = max(max_x, cx)
                    min_y = min(min_y, cy)
                    max_y = max(max_y, cy)
                    
                    for dx, dy in neighbors:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if pixels[nx, ny] == 0 and (nx, ny) not in visited:
                                visited.add((nx, ny))
                                q.append((nx, ny))
                
                # Filter noise
                if count > min_area:
                     components.append((min_x, min_y, max_x, max_y))
                     
    return components

def split_image(image_path, output_dir):
    try:
        img = Image.open(image_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    img = img.convert("RGBA")
    
    # Create white bg for analysis
    bg = Image.new("RGB", img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    gray = bg.convert("L")
    
    # Threshold
    threshold = 240
    # Use 0 for content, 255 for bg
    binary = gray.point(lambda p: 0 if p < threshold else 255)
    

    print("Detecting components...")
    bboxes = find_components(binary)
    print(f"Found {len(bboxes)} components (before merge).")
    
    # Merge nearby components
    # Heuristic: if distance between boxes is small, merge.
    # Or simply: merge if they overlap or are within X pixels.
    
    def boxes_intersect_or_close(b1, b2, tolerance=20):
        x1a, y1a, x2a, y2a = b1
        x1b, y1b, x2b, y2b = b2
        
        # Check if they are close
        return not (x2a + tolerance < x1b or x2b + tolerance < x1a or
                    y2a + tolerance < y1b or y2b + tolerance < y1a)

    def merge_boxes(b1, b2):
        return (min(b1[0], b2[0]), min(b1[1], b2[1]),
                max(b1[2], b2[2]), max(b1[3], b2[3]))

    merged = True
    while merged:
        merged = False
        new_bboxes = []
        while bboxes:
            b = bboxes.pop(0)
            was_merged = False
            for i, other in enumerate(new_bboxes):
                if boxes_intersect_or_close(b, other, tolerance=40):
                    new_bboxes[i] = merge_boxes(b, other)
                    was_merged = True
                    merged = True
                    break
            if not was_merged:
                new_bboxes.append(b)
        bboxes = new_bboxes
        
    print(f"Found {len(bboxes)} components (after merge).")
    
    # Filter small components (noise)
    bboxes = [b for b in bboxes if (b[2]-b[0])*(b[3]-b[1]) > 2000]
    
    # Sort: Top-to-bottom, Left-to-right
    # Assuming the layout is 2 rows of 2, or 1 row of 4.
    # We sort by Y centroid, then X centroid.
    bboxes.sort(key=lambda b: ((b[1]+b[3])//2 // 100, (b[0]+b[2])//2))
    
    names = ["accuracy", "latency", "protection", "communities", "extra1", "extra2"]
    
    for i, bbox in enumerate(bboxes):
        if i >= len(names): break
        
        pad = 10
        x1, y1, x2, y2 = bbox
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(img.width, x2 + pad)
        y2 = min(img.height, y2 + pad)
        
        cropped = img.crop((x1, y1, x2, y2))
        
        # Save
        filename = f"icon_{names[i]}.png"
        save_path = os.path.join(output_dir, filename)
        cropped.save(save_path)
        print(f"Saved {filename} ({x1},{y1} - {x2},{y2})")


if __name__ == "__main__":
    split_image("stats_icons_source.png", ".")
