import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { askOpenRouter, buildPageContext, type ChatMessage } from '../lib/openrouter';
import type { PublicUser } from '../lib/api';

type AssistantChatProps = {
  user: PublicUser;
  pageKey: string;
  pageTitle: string;
};

const MAX_MESSAGES = 5;

export function AssistantChat({ user, pageKey, pageTitle }: AssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant' as const,
      content: 'Hola. Puedo ayudarte con la operación de SAPAY Hotel dentro de este módulo.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const pageContext = useMemo(
    () => buildPageContext(pageKey, user.role),
    [pageKey, user.role]
  );

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const trimmedInput = input.trim();

  async function handleSend() {
    if (!trimmedInput || isLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user' as const, content: trimmedInput }
    ];

    if (nextMessages.length > MAX_MESSAGES) {
      setError('El asistente solo permite 5 mensajes por conversación. Reinicia el chat para continuar.');
      return;
    }

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const reply = await askOpenRouter(nextMessages, pageContext);
      setMessages((current) => {
        const updated: ChatMessage[] = [
          ...current,
          { role: 'assistant' as const, content: reply }
        ];
        if (updated.length > MAX_MESSAGES) {
          return updated.slice(updated.length - MAX_MESSAGES);
        }
        return updated;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo generar la respuesta del asistente en este momento.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        role: 'assistant' as const,
        content: `Bienvenido. Estoy listo para ayudarte en ${pageTitle}.`
      }
    ]);
    setError(null);
    setInput('');
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-[#eadfd6] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-[#eadfd6] bg-[#2e1c16] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Bot size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">Asistente SAPAY</p>
                <p className="text-[10px] text-[#f3e2d9]">Ayuda de la aplicación</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full p-1 text-[#f3e2d9] transition hover:bg-white/10"
                aria-label="Reiniciar conversación"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-[#f3e2d9] transition hover:bg-white/10"
                aria-label="Cerrar chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#fdfaf7] p-3">
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#f0e4dc] bg-white px-2 py-1.5 text-[10px] text-[#7a6a60]">
              <Sparkles size={12} />
              <span>Módulo actual: {pageTitle}</span>
            </div>

            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                    message.role === 'user'
                      ? 'ml-auto bg-[#4b2b21] text-white'
                      : 'bg-white text-[#2b1b14] shadow-sm ring-1 ring-[#f0e4dc]'
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {isLoading && (
                <div className="max-w-[75%] rounded-2xl bg-white px-3 py-2 text-[12px] text-[#6d5a51] shadow-sm ring-1 ring-[#f0e4dc]">
                  Pensando respuesta...
                </div>
              )}

              {error ? (
                <div className="rounded-xl border border-[#f0b7b7] bg-[#fff4f4] px-3 py-2 text-[11px] text-[#9d3f3f]">
                  {error}
                </div>
              ) : null}
            </div>

            <div ref={endOfMessagesRef} />
          </div>

          <div className="border-t border-[#eadfd6] bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Pregunta sobre esta pantalla..."
                className="h-9 flex-1 rounded-xl border border-[#eadfd6] bg-[#fffdfb] px-3 text-[12px] text-[#2b1b14] outline-none ring-0 placeholder:text-[#9b8e85] focus:border-[#4b2b21]"
                aria-label="Escribe tu pregunta al asistente"
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={!trimmedInput || isLoading}
                className="h-9 w-9 rounded-xl p-0"
                aria-label="Enviar pregunta"
              >
                <Send size={14} />
              </Button>
            </div>
            <p className="mt-2 text-[9px] text-[#85756d]">
              Límite: {messages.length}/{MAX_MESSAGES} mensajes
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4b2b21] text-white shadow-[0_20px_40px_rgba(75,43,33,0.35)] transition hover:scale-[1.02]"
          aria-label="Abrir asistente"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
