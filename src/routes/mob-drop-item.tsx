import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mob-drop-item')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/mob-drop-item"!</div>
}
