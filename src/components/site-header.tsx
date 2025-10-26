import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { Link } from "@tanstack/react-router";

export function SiteHeader({
  breadcrumbs,
}: {
  breadcrumbs: {
    title: any;
    pathname: any;
  }[];
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <nav className="flex items-center space-x-1 text-sm">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span key={crumb.pathname} className="flex items-center">
                {!isLast ? (
                  <Link
                    to={crumb.pathname}
                    className="text-muted-foreground hover:underline"
                  >
                    {crumb.title}
                  </Link>
                ) : (
                  <span className="font-medium">{crumb.title}</span>
                )}
                {!isLast && <span className="mx-1">/</span>}
              </span>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/WildEgo/m2-json"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
