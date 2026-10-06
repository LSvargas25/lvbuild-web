import {
  Building2,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  Receipt,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/features/auth/auth-context'
import { COMMERCIAL_ROLES } from '@/routes/route-roles'
import type { Role } from '@/types/roles'

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  /** Rutas que marcan el ítem como activo además de `url`. */
  matches?: string[]
  roles?: Role[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [{ title: 'Inicio', url: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Obras',
    items: [
      { title: 'Presupuestos', url: '/presupuestos', icon: ClipboardList, matches: ['/ofertas'] },
      {
        title: 'Proyectos',
        url: '/proyectos',
        icon: HardHat,
        matches: ['/bitacoras', '/planillas'],
      },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { title: 'Caja', url: '/comercial/caja', icon: Wallet, roles: COMMERCIAL_ROLES },
      { title: 'Facturas', url: '/comercial/facturas', icon: Receipt, roles: COMMERCIAL_ROLES },
    ],
  },
]

function isActive(pathname: string, item: NavItem) {
  if (item.url === '/') return pathname === '/'
  return [item.url, ...(item.matches ?? [])].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()
  const { hasRole } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-4" aria-hidden="true" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-wide">LvBuild</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.roles || hasRole(...item.roles))
          if (items.length === 0) return null
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={
                          <Link
                            to={item.url}
                            onClick={() => isMobile && setOpenMobile(false)}
                            aria-current={isActive(pathname, item) ? 'page' : undefined}
                          />
                        }
                        isActive={isActive(pathname, item)}
                      >
                        <item.icon aria-hidden="true" />
                        {item.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
