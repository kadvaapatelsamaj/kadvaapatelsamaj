/**
 * Cookie Consent & Visitor Logging System
 * Logs visitor details including location, browser, device info
 * Data stored in localStorage for CMS export
 */

(function() {
    'use strict';

    const CONSENT_KEY = 'visitor_cookie_consent';
    const LOGS_KEY = 'visitor_logs';

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
        }

        return { browser, version, userAgent: ua };
    }

    // Get OS details
    function getOSInfo() {
        const ua = navigator.userAgent;
        let os = 'Unknown';
        let osVersion = '';

        if (ua.includes('Windows NT 10.0')) {
            os = 'Windows';
            osVersion = '10/11';
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
            const match = ua.match(/Android (\d+\.?\d*)/);
            osVersion = match ? match[1] : '';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) {
            os = 'iOS';
            const match = ua.match(/OS (\d+_\d+)/);
            osVersion = match ? match[1].replace('_', '.') : '';
        } else if (ua.includes('Linux')) {
            os = 'Linux';
        }

        return { os, osVersion };
    }

    // Get device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'Tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'Mobile';
        }
        return 'Desktop';
    }

    // Get screen info
    function getScreenInfo() {
        return {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1
        };
    }

    // Get connection info
    function getConnectionInfo() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            return {
                effectiveType: conn.effectiveType || 'Unknown',
                downlink: conn.downlink || 'Unknown',
                rtt: conn.rtt || 'Unknown'
            };
        }
        return { effectiveType: 'Unknown', downlink: 'Unknown', rtt: 'Unknown' };
    }

    // Fetch location data from IP
    async function getLocationData() {
        try {
            // Using ip-api.com (free, no API key needed, 45 requests/minute)
            const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query');
            if (!response.ok) throw new Error('Location API failed');
            const data = await response.json();

            if (data.status === 'success') {
                return {
                    ip: data.query,
                    city: data.city,
                    region: data.regionName,
                    regionCode: data.region,
                    country: data.country,
                    countryCode: data.countryCode,
                    zipCode: data.zip,
                    latitude: data.lat,
                    longitude: data.lon,
                    timezone: data.timezone,
                    isp: data.isp,
                    organization: data.org,
                    asn: data.as
                };
            }
        } catch (error) {
            console.log('Primary location API failed, trying backup...');
        }

        // Backup API: ipapi.co (free tier: 1000/day)
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('Backup location API failed');
            const data = await response.json();

            return {
                ip: data.ip,
                city: data.city,
                region: data.region,
                regionCode: data.region_code,
                country: data.country_name,
                countryCode: data.country_code,
                zipCode: data.postal,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone,
                isp: data.org,
                organization: data.org,
                asn: data.asn
            };
        } catch (error) {
            console.error('Location detection failed:', error);
            return {
                ip: 'Unknown',
                city: 'Unknown',
                region: 'Unknown',
                country: 'Unknown',
                error: 'Location detection failed'
            };
        }
    }

    // Collect all visitor data
    async function collectVisitorData() {
        const browserInfo = getBrowserInfo();
        const osInfo = getOSInfo();
        const screenInfo = getScreenInfo();
        const connectionInfo = getConnectionInfo();
        const locationData = await getLocationData();

        return {
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString(),
            pageUrl: window.location.href,
            pageTitle: document.title,
            referrer: document.referrer || 'Direct',

            // Location Data
            location: locationData,

            // Browser Data
            browser: browserInfo.browser,
            browserVersion: browserInfo.version,
            userAgent: browserInfo.userAgent,

            // OS Data
            operatingSystem: osInfo.os,
            osVersion: osInfo.osVersion,

            // Device Data
            deviceType: getDeviceType(),

            // Screen Data
            screen: screenInfo,

            // Connection Data
            connection: connectionInfo,

            // Additional Info
            language: navigator.language,
            languages: navigator.languages ? navigator.languages.join(', ') : navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack === '1' ? 'Enabled' : 'Disabled',
            platform: navigator.platform,
            vendor: navigator.vendor,
            onlineStatus: navigator.onLine ? 'Online' : 'Offline',
            historyLength: window.history.length
        };
    }

    // Save visitor log
    function saveVisitorLog(visitorData) {
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

        // Keep last 1000 entries to prevent localStorage overflow
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }

        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        console.log('Visitor data logged:', visitorData);
    }

    // Create and show consent banner
    function showConsentBanner() {
        // Create styles
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
            .cookie-info-list {
                font-size: 12px;
                color: #b0b0b0;
                margin-top: 12px;
                padding-left: 0;
                list-style: none;
            }
            .cookie-info-list li {
                display: inline-block;
                margin-right: 15px;
                padding: 4px 0;
            }
            .cookie-info-list li::before {
                content: "\\2022";
                color: #ffd700;
                margin-right: 6px;
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
                .cookie-info-list li {
                    display: block;
                    margin: 5px 0;
                }
            }
        `;
        document.head.appendChild(styles);

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'cookie-consent-overlay';
        overlay.id = 'cookieConsentOverlay';

        // Create banner
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
                    <ul class="cookie-info-list">
                        <li>Location Data</li>
                        <li>Browser Info</li>
                        <li>Device Type</li>
                        <li>Screen Resolution</li>
                        <li>Visit Analytics</li>
                    </ul>
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

        // Handle accept
        document.getElementById('cookieAcceptBtn').addEventListener('click', async function() {
            localStorage.setItem(CONSENT_KEY, 'accepted');

            // Collect and save visitor data
            const visitorData = await collectVisitorData();
            visitorData.consentGiven = true;
            visitorData.consentTime = new Date().toISOString();
            saveVisitorLog(visitorData);

            // Remove banner
            document.getElementById('cookieConsentOverlay').remove();
            document.getElementById('cookieConsentBanner').remove();

            // Show thank you message
            showThankYouMessage();
        });

        // Handle decline
        document.getElementById('cookieDeclineBtn').addEventListener('click', function() {
            localStorage.setItem(CONSENT_KEY, 'declined');
            document.getElementById('cookieConsentOverlay').remove();
            document.getElementById('cookieConsentBanner').remove();
        });
    }

    // Show thank you message
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

        // Add fadeOut animation
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

    // Log page visit for returning users who already consented
    async function logPageVisit() {
        const visitorData = await collectVisitorData();
        visitorData.consentGiven = true;
        visitorData.returningVisitor = true;
        saveVisitorLog(visitorData);
    }

    // Export logs to text file
    window.exportVisitorLogs = function() {
        const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');

        if (logs.length === 0) {
            alert('No visitor logs found.');
            return;
        }

        let textContent = '='.repeat(80) + '\n';
        textContent += '                    VISITOR LOGS EXPORT\n';
        textContent += '                    Generated: ' + new Date().toLocaleString() + '\n';
        textContent += '='.repeat(80) + '\n\n';

        logs.forEach((log, index) => {
            textContent += '-'.repeat(80) + '\n';
            textContent += `VISITOR #${index + 1}\n`;
            textContent += '-'.repeat(80) + '\n';
            textContent += `Timestamp: ${log.timestamp}\n`;
            textContent += `Local Time: ${log.localTime}\n`;
            textContent += `Page URL: ${log.pageUrl}\n`;
            textContent += `Page Title: ${log.pageTitle}\n`;
            textContent += `Referrer: ${log.referrer}\n\n`;

            textContent += 'LOCATION INFORMATION:\n';
            if (log.location) {
                textContent += `  IP Address: ${log.location.ip}\n`;
                textContent += `  City: ${log.location.city}\n`;
                textContent += `  Region/State: ${log.location.region} (${log.location.regionCode})\n`;
                textContent += `  Country: ${log.location.country} (${log.location.countryCode})\n`;
                textContent += `  Zip Code: ${log.location.zipCode}\n`;
                textContent += `  Coordinates: ${log.location.latitude}, ${log.location.longitude}\n`;
                textContent += `  Timezone: ${log.location.timezone}\n`;
                textContent += `  ISP: ${log.location.isp}\n`;
                textContent += `  Organization: ${log.location.organization}\n`;
            }

            textContent += '\nBROWSER INFORMATION:\n';
            textContent += `  Browser: ${log.browser} ${log.browserVersion}\n`;
            textContent += `  User Agent: ${log.userAgent}\n`;

            textContent += '\nOPERATING SYSTEM:\n';
            textContent += `  OS: ${log.operatingSystem} ${log.osVersion}\n`;
            textContent += `  Platform: ${log.platform}\n`;

            textContent += '\nDEVICE INFORMATION:\n';
            textContent += `  Device Type: ${log.deviceType}\n`;
            if (log.screen) {
                textContent += `  Screen Resolution: ${log.screen.screenWidth}x${log.screen.screenHeight}\n`;
                textContent += `  Viewport Size: ${log.screen.viewportWidth}x${log.screen.viewportHeight}\n`;
                textContent += `  Color Depth: ${log.screen.colorDepth} bit\n`;
                textContent += `  Pixel Ratio: ${log.screen.pixelRatio}\n`;
            }

            textContent += '\nCONNECTION INFORMATION:\n';
            if (log.connection) {
                textContent += `  Connection Type: ${log.connection.effectiveType}\n`;
                textContent += `  Downlink: ${log.connection.downlink} Mbps\n`;
                textContent += `  RTT: ${log.connection.rtt} ms\n`;
            }

            textContent += '\nADDITIONAL DETAILS:\n';
            textContent += `  Language: ${log.language}\n`;
            textContent += `  Languages: ${log.languages}\n`;
            textContent += `  Cookies Enabled: ${log.cookiesEnabled}\n`;
            textContent += `  Do Not Track: ${log.doNotTrack}\n`;
            textContent += `  Online Status: ${log.onlineStatus}\n`;
            textContent += `  Consent Given: ${log.consentGiven}\n`;
            textContent += `  Returning Visitor: ${log.returningVisitor || false}\n`;

            textContent += '\n';
        });

        textContent += '='.repeat(80) + '\n';
        textContent += `Total Visitors Logged: ${logs.length}\n`;
        textContent += '='.repeat(80) + '\n';

        // Create and download file
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visitor_logs_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Export logs as JSON for CMS
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
        a.download = 'visitor_logs_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Get logs for CMS integration
    window.getVisitorLogs = function() {
        return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    };

    // Clear all logs
    window.clearVisitorLogs = function() {
        if (confirm('Are you sure you want to clear all visitor logs?')) {
            localStorage.removeItem(LOGS_KEY);
            alert('All visitor logs have been cleared.');
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const consent = localStorage.getItem(CONSENT_KEY);

        if (consent === 'accepted') {
            // User already accepted, log this page visit
            logPageVisit();
        } else if (consent !== 'declined') {
            // No decision yet, show banner
            showConsentBanner();
        }
        // If declined, do nothing
    }
})();
