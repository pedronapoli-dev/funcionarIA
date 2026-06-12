import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Política de Privacidade — educar-se-ia',
}

const PrivacidadePage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={13} />
          Voltar para o início
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">Política de Privacidade</h1>
        <p className="mt-2 text-xs text-gray-400">Última atualização: 12 de junho de 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <p>
              Esta Política de Privacidade descreve como o educar-se-ia coleta, usa e protege seus dados
              pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Dados que coletamos</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-medium text-gray-700">Cadastro:</span> email e senha. Opcionalmente, nome, universidade, curso e semestre.</li>
              <li><span className="font-medium text-gray-700">Conteúdo de estudo:</span> ementas enviadas (PDF ou texto), planos de estudo gerados, exercícios e suas respostas, check-ins de progresso.</li>
              <li><span className="font-medium text-gray-700">Uso do serviço:</span> número de planos criados e de chamadas de IA realizadas, usados para aplicar os limites do seu plano.</li>
              <li><span className="font-medium text-gray-700">Pagamento:</span> dados de cobrança são processados diretamente pela Stripe — não armazenamos números de cartão.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Finalidades do tratamento</h2>
            <p className="mt-2">Usamos seus dados para:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Criar e manter sua conta e autenticá-lo no serviço;</li>
              <li>Gerar planos de estudo, exercícios, diagnósticos e recalibrações personalizados via IA;</li>
              <li>Processar pagamentos e gerenciar sua assinatura;</li>
              <li>Aplicar os limites de uso do seu plano e exibir avisos de uso;</li>
              <li>Melhorar a qualidade e a confiabilidade do serviço.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Compartilhamento com terceiros</h2>
            <p className="mt-2">
              Não vendemos seus dados. Para operar o serviço, compartilhamos dados com os seguintes
              operadores, cada um sujeito às suas próprias políticas de privacidade:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-medium text-gray-700">Supabase</span> — banco de dados, autenticação e hospedagem dos seus dados;</li>
              <li><span className="font-medium text-gray-700">Stripe</span> — processamento de pagamentos e gestão de assinaturas;</li>
              <li><span className="font-medium text-gray-700">Anthropic (Claude API)</span> — geração de planos, exercícios e diagnósticos por IA. As ementas e respostas que você envia são processadas pela Anthropic para gerar esse conteúdo;</li>
              <li><span className="font-medium text-gray-700">YouTube Data API</span> — quando habilitado, usado para sugerir vídeos educativos relacionados ao seu plano.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Retenção de dados</h2>
            <p className="mt-2">
              Seus dados são mantidos enquanto sua conta existir. Ao excluir sua conta pela página{' '}
              <Link href="/conta" className="underline hover:text-gray-900">Minha Conta</Link>, todos os
              seus dados — perfil, disciplinas, planos, exercícios e sessões de estudo — são removidos
              permanentemente de forma imediata.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Seus direitos (LGPD, art. 18)</h2>
            <p className="mt-2">Você tem direito a:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><span className="font-medium text-gray-700">Acesso e correção</span> — visualizar e atualizar seus dados de cadastro pela página <Link href="/conta" className="underline hover:text-gray-900">Minha Conta</Link>;</li>
              <li><span className="font-medium text-gray-700">Exclusão</span> — apagar permanentemente sua conta e todos os dados associados, também em <Link href="/conta" className="underline hover:text-gray-900">Minha Conta</Link>;</li>
              <li><span className="font-medium text-gray-700">Portabilidade</span> — solicitar uma cópia dos seus dados entrando em contato pelo email abaixo;</li>
              <li><span className="font-medium text-gray-700">Revogação de consentimento</span> — a qualquer momento, encerrando sua conta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Cookies</h2>
            <p className="mt-2">
              Utilizamos apenas cookies essenciais de sessão, geridos pelo Supabase Auth, necessários para
              manter você autenticado. Não utilizamos cookies de rastreamento, publicidade ou ferramentas
              de análise de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Segurança</h2>
            <p className="mt-2">
              Adotamos medidas técnicas razoáveis para proteger seus dados, incluindo controle de acesso
              por usuário (row-level security) e conexões criptografadas (HTTPS). Nenhum sistema é
              totalmente livre de riscos, e trabalhamos continuamente para reduzi-los.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Menores de idade</h2>
            <p className="mt-2">
              O educar-se-ia não é destinado a menores de 18 anos sem a supervisão e o consentimento de
              um responsável legal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Alterações nesta política</h2>
            <p className="mt-2">
              Podemos atualizar esta política periodicamente. A versão vigente estará sempre disponível
              nesta página, com a data da última atualização indicada acima.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">10. Contato</h2>
            <p className="mt-2">
              Para exercer seus direitos ou tirar dúvidas sobre o tratamento dos seus dados, entre em
              contato pelo email{' '}
              <a href="mailto:contato@educarse-ia.com.br" className="underline hover:text-gray-900">
                contato@educarse-ia.com.br
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacidadePage
