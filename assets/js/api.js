/**
 * APIHandler Class
 * Simulates a backend server using LocalStorage + Static JSON.
 * "The Expert Move": Abstraction layer that behaves like a real API.
 */
class APIHandler {
    constructor() {
        this.endpoints = {
            reviews: 'assets/data/reviews.json',
            reservations: 'assets/data/reservations.json' // Added as requested
        };
        this.storageKeys = {
            reviews: 'quannem_reviews_local',
            reservations: 'quannem_reservations_local'
        };
    }

    /**
     * Simulate a GET request.
     * Fetches static JSON and merges with LocalStorage data.
     * @param {string} resource - 'reviews' or 'reservations'
     */
    async get(resource) {
        let staticData = [];

        // 1. Fetch Static Data (The "Database" initial state)
        if (this.endpoints[resource]) {
            try {
                // Fix path for Admin panel if needed (relative check)
                const pathPrefix = window.location.pathname.includes('admin.html') ? '' : '';
                // Since assets is in root, 'assets/...' works for both index.html and admin.html (if in root)

                const response = await fetch(pathPrefix + this.endpoints[resource]);
                if (response.ok) {
                    staticData = await response.json();
                }
            } catch (e) {
                console.warn(`Could not fetch static data for ${resource}:`, e);
            }
        }

        // 2. Fetch Local Data (The "New" data added by user)
        const localData = JSON.parse(localStorage.getItem(this.storageKeys[resource])) || [];

        // 3. Merge Strategies
        const merged = [...staticData, ...localData];

        // Filter duplicates based on 'id' just in case data was manually moved to static
        const unique = merged.filter((item, index, self) =>
            index === self.findIndex((t) => (
                t.id === item.id
            ))
        );

        return unique;
    }

    /**
     * Send data to Discord via Webhook.
     * @param {string} resource - Resource type
     * @param {object} data - Data to send
     */
    async sendDiscord(resource, data) {
        // Real Webhook URL provided by User
        const webhookURL = 'https://discord.com/api/webhooks/1473867393041436738/YUDfUYLIwZ_ITdDQS7dZDnrmB3SMuQY_UR92TtImlVjqmx2krIgkVq9ZrbC9H_ecITxG';

        const payload = {
            embeds: [{
                title: `🔔 New ${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
                color: resource === 'reviews' ? 0xF1C40F : 0x2ECC71, // Gold/Green
                description: `A new ${resource} has been submitted!`,
                fields: Object.keys(data).map(key => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: String(data[key] || 'N/A'),
                    inline: true
                })),
                footer: {
                    text: "Quán Nem System"
                },
                timestamp: new Date().toISOString()
            }]
        };

        try {
            await fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Sent to Discord!');
        } catch (e) {
            console.error('Discord Webhook failed:', e);
        }
    }

    /**
     * Simulate a POST request.
     * Saves data to LocalStorage.
     * @param {string} resource - 'reviews' or 'reservations'
     * @param {object} data - The data payload
     */
    async post(resource, data) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get existing local data
        const currentData = JSON.parse(localStorage.getItem(this.storageKeys[resource])) || [];

        // Add metadata (ID, Timestamp)
        const newItem = {
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };

        // Save Local
        currentData.push(newItem);
        localStorage.setItem(this.storageKeys[resource], JSON.stringify(currentData));

        // Send to Discord (Fire and Forget)
        this.sendDiscord(resource, newItem);

        return { success: true, message: 'Saved successfully', data: newItem };
    }
}

export default new APIHandler();
