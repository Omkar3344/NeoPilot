# Phone Camera Setup Guide

This guide will help you connect your phone camera to NeoPilot to reduce lag and improve performance.

## 📱 Why Use Phone Camera?

- **Better Performance**: Reduces lag from laptop camera processing
- **Higher Quality**: Modern phone cameras have better sensors
- **Flexibility**: Position your phone anywhere for optimal angle
- **Wireless**: No cables needed, just WiFi

---

## 🚀 Quick Setup

### Step 1: Install IP Webcam App

**Android:**
1. Open Google Play Store
2. Search for "IP Webcam"
3. Install the app by Pavel Khlebovich (free, ~5MB)
4. Or download directly: https://play.google.com/store/apps/details?id=com.pas.webcam

**iOS Alternative:**
- Use "EpocCam" or "iVCam" (similar setup process)

---

### Step 2: Connect to Same WiFi

**Important:** Both your phone and laptop must be on the **same WiFi network**

1. On your phone: Settings → WiFi
2. Connect to your home/office WiFi
3. On your laptop: Verify you're connected to the same network
4. Note: Won't work if devices are on different networks

---

### Step 3: Start IP Webcam Server

1. Open IP Webcam app on your phone
2. Scroll down and tap **"Start Server"** button (bottom of screen)
3. The app will show an IP address like:
   ```
   http://192.168.1.100:8080
   ```
4. **Copy this IP address** (you'll need it in Step 4)

**Optional Settings (before starting server):**
- Video Preferences → Resolution: **640x480** or **800x600** (lower = faster)
- Video Preferences → Quality: **50-70%** (balance quality & speed)
- Video Preferences → FPS Limit: **30 FPS**
- Video Preferences → Orientation: **Landscape** or **Portrait** (your preference)

---

### Step 4: Connect in NeoPilot

1. Start your NeoPilot backend:
   ```powershell
   cd C:\Users\HP\Desktop\NeoPilot\backend
   python main.py
   ```

2. Start your NeoPilot frontend:
   ```powershell
   cd C:\Users\HP\Desktop\NeoPilot\frontend
   npm run dev
   ```

3. Open NeoPilot in browser: http://localhost:5173

4. Click the **camera button** in the header (shows "Laptop Camera")

5. A modal will appear with two options:
   - **Laptop Camera**: Built-in webcam (default)
   - **Phone Camera**: Via IP Webcam

6. Select **Phone Camera** option

7. Enter the IP address from Step 3 (example: `192.168.1.100:8080`)
   - **Important:** Enter ONLY the IP and port, NOT the full URL
   - ✅ Correct: `192.168.1.100:8080`
   - ❌ Wrong: `http://192.168.1.100:8080`

8. Click **"Connect Phone Camera"**

9. If successful:
   - Camera button will turn orange
   - Label will show "Phone Camera"
   - Webcam feed will switch to phone camera

---

## 🎯 Positioning Your Phone

### Best Setup for Hand Gesture Detection:

1. **Distance**: 
   - Position phone **1-2 feet** (30-60cm) from your hand
   - Close enough to see hand clearly
   - Far enough to capture full hand movements

2. **Angle**:
   - Camera should face **directly at you**
   - Avoid extreme angles (top-down or side views)
   - Keep phone vertical (portrait) or horizontal (landscape) - both work

3. **Lighting**:
   - Light source **behind the phone**, shining on your hand
   - Avoid backlighting (light behind you)
   - Bright, even lighting is best

4. **Stability**:
   - Use a phone stand or prop phone against something
   - Shaky camera = poor detection
   - Fixed position works best

5. **Background**:
   - Simple, uncluttered background
   - Contrasting color to your hand
   - Avoid busy patterns or other people in frame

---

## 🔄 Switching Between Cameras

You can switch between laptop and phone camera anytime:

1. Click the camera button in header
2. Select desired camera source
3. For phone: Enter IP address (only first time)
4. Connection switches immediately

**Current camera shown:**
- 🟦 Blue = Laptop Camera
- 🟧 Orange = Phone Camera

---

## ⚡ Performance Tips

### For Best Performance:

1. **Lower Resolution**: 
   - In IP Webcam: Video Preferences → Resolution → **640x480**
   - Higher resolution = more lag

2. **Reduce Quality**:
   - In IP Webcam: Video Preferences → Quality → **50%**
   - Still clear enough for gesture detection

3. **Limit FPS**:
   - In IP Webcam: Video Preferences → FPS → **30**
   - Higher FPS = more processing needed

4. **Close Other Apps**:
   - Close unnecessary apps on phone
   - Close unnecessary browser tabs on laptop

5. **Strong WiFi Signal**:
   - Both devices close to router
   - 5GHz WiFi better than 2.4GHz (if available)

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to phone camera"

**Check:**
1. ✓ Phone and laptop on same WiFi?
2. ✓ IP Webcam server is running on phone?
3. ✓ Entered correct IP address (without `http://`)?
4. ✓ Firewall not blocking connection?
5. ✓ Try restarting IP Webcam server

**Test connection:**
- Open browser on laptop
- Go to: `http://192.168.1.100:8080` (your IP)
- Should see IP Webcam web interface
- If this doesn't work, check WiFi/IP address

---

### Issue: "Camera shows but image is frozen"

**Solutions:**
1. Lower resolution in IP Webcam settings
2. Reduce quality to 50%
3. Restart IP Webcam server
4. Switch to laptop camera and back

---

### Issue: "Lag is still present"

**Try:**
1. Use 5GHz WiFi instead of 2.4GHz
2. Move phone closer to router
3. Lower resolution to 320x240 (very low but fastest)
4. Close other network-heavy applications
5. Restart router

---

### Issue: "Can't find my phone's IP address"

**Find IP on Phone:**

**Android:**
1. Settings → About Phone → Status → IP Address
2. Or: Settings → WiFi → Tap your network → IP Address

**In IP Webcam App:**
- The IP is shown in large text when server is running
- Format: `http://192.168.X.X:8080`
- Copy everything after `http://` and before `/`

**Command Line (if phone and laptop are connected):**
- Windows: `ipconfig` (look for Default Gateway, your phone IP will be similar)

---

### Issue: "IP address keeps changing"

**Solution: Set Static IP**

**On Router:**
1. Log into router admin panel
2. Find DHCP settings
3. Reserve IP for your phone (using MAC address)
4. Phone will always get same IP

**On Phone (Android):**
1. Settings → WiFi
2. Tap your network
3. Advanced → IP Settings → Static
4. Set a static IP (e.g., 192.168.1.150)
5. Save and reconnect

---

## 📊 Expected Performance

### With Laptop Camera:
- Latency: 100-300ms
- FPS: 20-30
- Gesture Detection: Good

### With Phone Camera (Optimized):
- Latency: 50-150ms
- FPS: 25-30
- Gesture Detection: Excellent
- Overall: **Much smoother experience**

---

## 🔒 Security Notes

- IP Webcam server is **accessible to anyone on your WiFi**
- Don't use on public WiFi
- Stop server when not in use
- Consider setting a password in IP Webcam settings:
  - Local Broadcasting → Username/Password

---

## 💡 Pro Tips

1. **Save Your IP**: 
   - Write down your phone's IP address
   - NeoPilot remembers it for next time

2. **Quick Toggle**:
   - Switch between cameras instantly
   - No need to restart backend

3. **Multiple Devices**:
   - Can use any phone/tablet with IP Webcam
   - Just enter different IP address

4. **Battery Life**:
   - Keep phone plugged in during use
   - Streaming video drains battery quickly

5. **Test First**:
   - Test phone camera with simple gestures first
   - Adjust position/angle before flying drone

---

## 📱 Alternative Apps

If IP Webcam doesn't work, try these alternatives:

### Android:
- **DroidCam** (also works with USB)
- **iVCam** (wireless or USB)
- **IP Camera Adapter**

### iOS:
- **EpocCam** (free and pro versions)
- **iVCam** (cross-platform)
- **Reincubate Camo** (high quality, paid)

All work similarly - setup instructions are comparable.

---

## 🎯 Quick Reference

| Setting | Recommended Value |
|---------|------------------|
| Resolution | 640x480 |
| Quality | 50-70% |
| FPS | 30 |
| Distance | 1-2 feet |
| Lighting | Front-lit |
| WiFi | 5GHz preferred |

---

## ✅ Setup Checklist

Before starting:
- [ ] IP Webcam app installed on phone
- [ ] Phone connected to same WiFi as laptop
- [ ] IP Webcam server started
- [ ] IP address copied
- [ ] NeoPilot backend running
- [ ] NeoPilot frontend running
- [ ] Phone positioned with good lighting
- [ ] Camera source switched to "Phone Camera"
- [ ] IP address entered and connected
- [ ] Webcam feed showing phone camera view

**Ready to fly! 🚁**

---

## 🆘 Still Having Issues?

1. Try laptop camera first to verify NeoPilot works
2. Test phone camera in browser: `http://YOUR_IP:8080`
3. Check backend logs for error messages
4. Restart both backend and frontend
5. Restart IP Webcam app
6. Restart phone and laptop if needed

---

**Happy Flying! ✨**
