// Thin wrapper over lucide-react so the rest of the app references icons by string
// name. This keeps icon usage consistent and makes it trivial to swap the icon set.
import {
  LayoutDashboard, Calendar, CalendarClock, Mail, Inbox, CheckSquare, Newspaper,
  Settings, Menu, Search, RefreshCw, Sun, Moon, User, Bell, MapPin, Video, Clock,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Trash2,
  Pencil, X, ExternalLink, Star, Info, CloudRain, Cloud, Wind, Umbrella,
  GripVertical, Check, Circle, CircleCheck, Flag, Sparkles, HelpCircle, Link2,
  Filter, ThumbsUp, ThumbsDown, ArrowRight, Bookmark, BookmarkCheck, Briefcase,
  GraduationCap, Plane, PiggyBank, Dumbbell, Globe, Home, Eye,
} from 'lucide-react'

const MAP = {
  LayoutDashboard, Calendar, CalendarClock, Mail, Inbox, CheckSquare, Newspaper,
  Settings, Menu, Search, RefreshCw, Sun, Moon, User, Bell, MapPin, Video, Clock,
  AlertTriangle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Plus, Trash2,
  Pencil, X, ExternalLink, Star, Info, CloudRain, Cloud, Wind, Umbrella,
  GripVertical, Check, Circle, CircleCheck, Flag, Sparkles, HelpCircle, Link2,
  Filter, ThumbsUp, ThumbsDown, ArrowRight, Bookmark, BookmarkCheck, Briefcase,
  GraduationCap, Plane, PiggyBank, Dumbbell, Globe, Home, Eye,
}

export function Icon({ name, size = 18, className = '', ...rest }) {
  const Cmp = MAP[name] || Circle
  return <Cmp size={size} className={className} aria-hidden="true" {...rest} />
}
