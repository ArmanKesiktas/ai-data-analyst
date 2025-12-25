import { useState, useEffect } from 'react'
import Joyride, { STATUS, EVENTS } from 'react-joyride'
import { useTheme } from '../context/ThemeContext'

// Onboarding tour steps
const TOUR_STEPS = [
    {
        target: 'body',
        content: 'Welcome to QueryMind AI! Let me show you around the platform. 🎉',
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="sidebar"]',
        content: 'This is your navigation sidebar. Access tables, query history, and switch between pages here.',
        placement: 'right',
    },
    {
        target: '[data-tour="query-page"]',
        content: 'Query page lets you ask questions about your data in natural language. AI will generate SQL for you!',
        placement: 'bottom',
    },
    {
        target: '[data-tour="data-view"]',
        content: 'View and manage your table data here. You can sort, filter, edit rows, and export to Excel.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="dashboard"]',
        content: 'Create beautiful dashboards with AI! Just describe what you want or choose from templates.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="data-sources"]',
        content: 'Your data sources appear here. Upload CSV/Excel files or create tables manually.',
        placement: 'right',
    },
    {
        target: '[data-tour="theme-toggle"]',
        content: 'Toggle between light and dark mode with this button.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="workspace"]',
        content: 'Manage your workspaces here. Create new ones or switch between existing workspaces.',
        placement: 'bottom',
    },
    {
        target: 'body',
        content: 'You\'re all set! Press Shift+? anytime to see keyboard shortcuts. Happy analyzing! 🚀',
        placement: 'center',
    },
]

export default function OnboardingTour({ run, onComplete }) {
    const { theme } = useTheme()

    const handleCallback = (data) => {
        const { status, type } = data

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            onComplete()
            // Save to localStorage so we don't show again
            localStorage.setItem('onboardingComplete', 'true')
        }
    }

    // Custom styles for the tour
    const styles = {
        options: {
            arrowColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#3b82f6',
            textColor: theme === 'dark' ? '#f1f5f9' : '#111827',
            zIndex: 10000,
        },
        buttonNext: {
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
        },
        buttonBack: {
            color: theme === 'dark' ? '#94a3b8' : '#6b7280',
            marginRight: 10,
        },
        buttonSkip: {
            color: theme === 'dark' ? '#94a3b8' : '#6b7280',
        },
        tooltip: {
            borderRadius: '12px',
            padding: '20px',
        },
        tooltipContent: {
            padding: '10px 0',
        },
    }

    return (
        <Joyride
            steps={TOUR_STEPS}
            run={run}
            continuous
            showProgress
            showSkipButton
            hideCloseButton={false}
            scrollToFirstStep
            spotlightClicks
            disableOverlayClose
            callback={handleCallback}
            styles={styles}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip Tour',
            }}
        />
    )
}

// Hook to check if onboarding should run
export function useOnboarding() {
    const [shouldRun, setShouldRun] = useState(false)

    useEffect(() => {
        const completed = localStorage.getItem('onboardingComplete')
        if (!completed) {
            // Delay start to let page render
            const timer = setTimeout(() => setShouldRun(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const resetOnboarding = () => {
        localStorage.removeItem('onboardingComplete')
        setShouldRun(true)
    }

    const completeOnboarding = () => {
        setShouldRun(false)
        localStorage.setItem('onboardingComplete', 'true')
    }

    return { shouldRun, resetOnboarding, completeOnboarding }
}
