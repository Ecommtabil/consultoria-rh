import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/_authenticated/escala/')({ beforeLoad: () => { throw redirect({ to: '/escala/funcionamento' }); } });
