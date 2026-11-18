import { createFileRoute } from '@tanstack/react-router';
import { FuncionamentoPage } from '@/components/escala/funcionamento';
export const Route = createFileRoute('/_authenticated/escala/funcionamento')({ component: FuncionamentoPage });
