// Slack/Teams Integration Service
// Provides webhook-based notification capabilities

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Send dashboard summary to Slack
export async function sendToSlack(webhookUrl, dashboardData) {
    const { title, widgets, filters } = dashboardData

    // Format message for Slack
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `📊 Dashboard: ${title}`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Widgets:* ${widgets.length} items\n*Created:* ${new Date().toLocaleString()}`
            }
        },
        {
            type: "divider"
        }
    ]

    // Add widget summaries
    widgets.slice(0, 5).forEach(widget => {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `• *${widget.title}* (${widget.type.replace('_', ' ')})`
            }
        })
    })

    if (widgets.length > 5) {
        blocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `_+ ${widgets.length - 5} more widgets..._`
                }
            ]
        })
    }

    // Add action buttons
    blocks.push({
        type: "actions",
        elements: [
            {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "View Dashboard",
                    emoji: true
                },
                url: window.location.href,
                style: "primary"
            }
        ]
    })

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocks })
        })
        return response.ok
    } catch (error) {
        console.error('Slack webhook error:', error)
        return false
    }
}

// Send dashboard summary to Microsoft Teams
export async function sendToTeams(webhookUrl, dashboardData) {
    const { title, widgets, filters } = dashboardData

    // Format Adaptive Card for Teams
    const card = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "3b82f6",
        "summary": `Dashboard: ${title}`,
        "sections": [
            {
                "activityTitle": `📊 Dashboard: ${title}`,
                "activitySubtitle": `${widgets.length} widgets • Created ${new Date().toLocaleString()}`,
                "facts": widgets.slice(0, 5).map(w => ({
                    name: w.title,
                    value: w.type.replace('_', ' ')
                })),
                "markdown": true
            }
        ],
        "potentialAction": [
            {
                "@type": "OpenUri",
                "name": "View Dashboard",
                "targets": [
                    { "os": "default", "uri": window.location.href }
                ]
            }
        ]
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        })
        return response.ok
    } catch (error) {
        console.error('Teams webhook error:', error)
        return false
    }
}

// Get saved webhook URLs from localStorage
export function getWebhookSettings() {
    try {
        const settings = localStorage.getItem('webhookSettings')
        return settings ? JSON.parse(settings) : { slack: '', teams: '' }
    } catch {
        return { slack: '', teams: '' }
    }
}

// Save webhook URLs to localStorage
export function saveWebhookSettings(settings) {
    localStorage.setItem('webhookSettings', JSON.stringify(settings))
}
