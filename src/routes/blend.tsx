import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/blend')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/blend"!</div>
}
