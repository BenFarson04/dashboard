import { useEffect, useState } from 'react'
import { Icon } from '../ui/Icon'
import { Card, Badge, Chip } from '../ui/primitives'
import { cn } from '../../utils'
import ThemeSwitcher from '../../utils/themeSwitcher'

/**
 * Theme Settings Component
 * Allows users to switch between v1 (original) and v2 (experimental) designs
 */
export function ThemeSettings() {
  const [currentTheme, setCurrentTheme] = useState('v1')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCurrentTheme(ThemeSwitcher.getTheme())
    setMounted(true)
  }, [])

  const handleThemeChange = (theme) => {
    ThemeSwitcher.setTheme(theme)
    setCurrentTheme(theme)
  }

  if (!mounted) return null

  return (
    <Card title="Dashboard Design" icon="Palette">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose your dashboard design style. v2 is an experimental premium redesign.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {/* v1 Option */}
          <button
            onClick={() => handleThemeChange('v1')}
            className={cn(
              'interactive-row flex flex-col gap-2 rounded-lg border p-4 text-left transition-all',
              currentTheme === 'v1'
                ? 'border-indigo-500 bg-indigo-50/30 dark:border-indigo-400 dark:bg-indigo-950/30'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Original Design
              </h3>
              {currentTheme === 'v1' && (
                <Badge tone="blue" icon="Check">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Classic layout with comfortable spacing and familiar styling.
            </p>
            <div className="flex flex-wrap gap-1">
              <Chip active={false} disabled className="text-[10px]">Familiar</Chip>
              <Chip active={false} disabled className="text-[10px]">Spacious</Chip>
              <Chip active={false} disabled className="text-[10px]">Standard</Chip>
            </div>
          </button>

          {/* v2 Option */}
          <button
            onClick={() => handleThemeChange('v2')}
            className={cn(
              'interactive-row flex flex-col gap-2 rounded-lg border p-4 text-left transition-all',
              currentTheme === 'v2'
                ? 'border-indigo-500 bg-indigo-50/30 dark:border-indigo-400 dark:bg-indigo-950/30'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                v2 Experimental
                <Badge tone="amber" icon="Sparkles" className="text-[10px]">
                  Beta
                </Badge>
              </h3>
              {currentTheme === 'v2' && (
                <Badge tone="blue" icon="Check">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Premium redesign inspired by Linear and Raycast. Information-dense and refined.
            </p>
            <div className="flex flex-wrap gap-1">
              <Chip active={false} disabled className="text-[10px]">Dense</Chip>
              <Chip active={false} disabled className="text-[10px]">Professional</Chip>
              <Chip active={false} disabled className="text-[10px]">Modern</Chip>
            </div>
          </button>
        </div>

        {currentTheme === 'v2' && (
          <div className="rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/20">
            <div className="flex gap-2">
              <Icon name="AlertCircle" size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold">Experimental Design</p>
                <p className="mt-0.5">This is an experimental redesign. Features are complete but design may change based on feedback.</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Your preference is saved locally. <a href="#" className="text-indigo-600 hover:underline dark:text-indigo-300">View design documentation</a>
        </div>
      </div>
    </Card>
  )
}

export default ThemeSettings
