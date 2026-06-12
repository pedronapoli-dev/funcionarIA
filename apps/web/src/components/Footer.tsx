import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="border-t border-gray-100 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600">
            <GraduationCap className="text-white" size={12} />
          </div>
          <span className="text-xs font-semibold text-gray-500">educar-se-ia</span>
        </div>

        <nav className="flex items-center gap-4 text-xs text-gray-400">
          <Link href="/termos" className="hover:text-gray-600 transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-gray-600 transition-colors">Política de Privacidade</Link>
          <a href="mailto:contato@educarse-ia.com.br" className="hover:text-gray-600 transition-colors">Contato</a>
        </nav>

        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} educar-se-ia. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
