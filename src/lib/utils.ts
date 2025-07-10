import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SeverityLevel, SeverityConfig } from '../types/ash'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const severityConfig: Record<SeverityLevel, SeverityConfig> = {
  CRITICAL: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔴',
    priority: 4,
  },
  HIGH: {
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '🟠',
    priority: 3,
  },
  MEDIUM: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '🟡',
    priority: 2,
  },
  LOW: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '🟢',
    priority: 1,
  },
} 