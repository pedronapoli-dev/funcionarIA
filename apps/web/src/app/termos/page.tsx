import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Termos de Uso — educar-se-ia',
}

const TermosPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={13} />
          Voltar para o início
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">Termos de Uso</h1>
        <p className="mt-2 text-xs text-gray-400">Última atualização: 12 de junho de 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Sobre o serviço</h2>
            <p className="mt-2">
              O educar-se-ia é um serviço que utiliza inteligência artificial para transformar ementas
              acadêmicas em planos de estudo personalizados, com exercícios, acompanhamento de progresso
              e revisão espaçada. O serviço é operado por uma pessoa física, CPF{' '}
              <span className="font-medium text-gray-700">[CPF do responsável]</span>, doravante
              &quot;educar-se-ia&quot; ou &quot;nós&quot;.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Cadastro e conta</h2>
            <p className="mt-2">
              Para usar o educar-se-ia você precisa criar uma conta com email e senha. Você é responsável
              por manter suas credenciais em sigilo e por todas as atividades realizadas na sua conta.
              Você pode gerenciar seus dados e excluir sua conta a qualquer momento na página{' '}
              <Link href="/conta" className="underline hover:text-gray-900">Minha Conta</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Planos, cobrança e cancelamento</h2>
            <p className="mt-2">
              O educar-se-ia oferece um plano gratuito com limites de uso e planos pagos com recursos
              adicionais, descritos na página{' '}
              <Link href="/planos" className="underline hover:text-gray-900">Planos</Link>. Pagamentos são
              processados pela Stripe e cobrados de forma recorrente (mensal ou anual, conforme o plano
              escolhido). Você pode cancelar sua assinatura a qualquer momento; o cancelamento interrompe
              cobranças futuras, e o acesso aos recursos do plano pago continua até o fim do período já
              pago. Não há reembolso de períodos parciais, salvo disposição legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Conteúdo gerado por inteligência artificial</h2>
            <p className="mt-2">
              Os planos de estudo, exercícios, diagnósticos e recomendações são gerados automaticamente
              por modelos de IA com base nas informações que você envia (como ementas e respostas).
              Esse conteúdo pode conter imprecisões ou erros e não substitui a orientação de professores,
              instituições de ensino ou bibliografia oficial. Use o conteúdo gerado como apoio aos seus
              estudos, sempre verificando informações importantes em fontes confiáveis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Uso aceitável e conteúdo enviado</h2>
            <p className="mt-2">
              Você é responsável pelo conteúdo que envia (ementas, textos, respostas de exercícios) e
              garante que possui o direito de compartilhá-lo. É proibido usar o educar-se-ia para enviar
              conteúdo ilegal, ofensivo, ou para tentar acessar dados de outros usuários ou comprometer a
              segurança do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Limitação de responsabilidade</h2>
            <p className="mt-2">
              O educar-se-ia é fornecido &quot;como está&quot;, sem garantias de disponibilidade
              ininterrupta ou de resultados específicos de aprendizagem. Na máxima extensão permitida pela
              lei, não nos responsabilizamos por danos indiretos decorrentes do uso ou da impossibilidade
              de uso do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Alterações nestes termos</h2>
            <p className="mt-2">
              Podemos atualizar estes Termos de Uso periodicamente para refletir mudanças no serviço ou em
              requisitos legais. A versão vigente estará sempre disponível nesta página, com a data da
              última atualização indicada acima.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Lei aplicável e foro</h2>
            <p className="mt-2">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da
              comarca de <span className="font-medium text-gray-700">[comarca]</span> para dirimir
              eventuais conflitos, salvo disposição em contrário da legislação aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Contato</h2>
            <p className="mt-2">
              Dúvidas sobre estes termos podem ser enviadas para{' '}
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

export default TermosPage
