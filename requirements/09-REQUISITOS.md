# Requisitos Funcionais e Não-Funcionais - SpeakUp

> **ATUALIZADO**: Este documento reflete os novos requisitos com sessões gerenciadas por admin, sistema de créditos e tópicos de IA.

## Requisitos Funcionais (RF)

### RF01 - Autenticação e Perfil
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF01.1 | Sistema deve permitir login via Google OAuth 2.0 | Alta |
| RF01.2 | Sistema deve permitir login via GitHub OAuth | Média |
| RF01.3 | Sistema deve criar perfil automático com dados do OAuth (nome, email, foto) | Alta |
| RF01.4 | Usuário deve poder selecionar idioma nativo | Alta |
| RF01.5 | Usuário deve poder selecionar idioma para praticar (EN/ES) | Alta |
| RF01.6 | Usuário deve poder selecionar nível de proficiência (Iniciante/Intermediário/Avançado) | Alta |
| RF01.7 | Usuário deve poder editar suas preferências a qualquer momento | Média |
| RF01.8 | Sistema deve manter sessão do usuário por 7 dias | Média |
| RF01.9 | Sistema deve permitir logout | Alta |
| RF01.10 | Sistema deve permitir exclusão de conta (LGPD) | Alta |

---

### RF02 - Tela Inicial (Lobby)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF02.1 | Exibir estatísticas do usuário: Total Calls | Alta |
| RF02.2 | Exibir estatísticas do usuário: Total Practice Time | Alta |
| RF02.3 | Exibir estatísticas do usuário: Average Call Duration | Alta |
| RF02.4 | Exibir estatísticas do usuário: This Week (conversas) | Alta |
| RF02.5 | Exibir estatísticas do usuário: This Month (conversas) | Alta |
| RF02.6 | Exibir saldo de créditos (sessões e conversas) | Alta |
| RF02.7 | Exibir próxima sessão disponível com horário | Alta |
| RF02.8 | Botão "Entrar na Sessão" habilitado quando sessão ativa | Alta |
| RF02.9 | Botão "Entrar na Sessão" desabilitado quando sem sessão ativa | Alta |
| RF02.10 | Exibir mensagem quando não há sessão ativa | Média |

---

### RF03 - Sistema de Sessões (Admin)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF03.1 | Admin deve poder criar períodos/sessões (CRUD) | Alta |
| RF03.2 | Cada período deve ter horário de início e fim (ex: 19:00-20:00) | Alta |
| RF03.3 | Cada período deve ter timezone configurável | Alta |
| RF03.4 | Admin deve poder habilitar/desabilitar uma sessão | Alta |
| RF03.5 | Sessão desabilitada não permite entrada de usuários | Alta |
| RF03.6 | Sistema deve calcular automaticamente se sessão está ativa | Alta |
| RF03.7 | Admin deve poder ver sessões ativas em tempo real | Alta |
| RF03.8 | Admin deve poder ver quantidade de usuários por sessão | Alta |
| RF03.9 | Admin deve poder limpar fila de espera de uma sessão | Média |
| RF03.10 | Sistema deve mostrar histórico de sessões passadas | Média |

---

### RF04 - Sistema de Matching
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF04.1 | Sistema deve manter fila de espera por sessão | Alta |
| RF04.2 | Sistema NÃO deve repetir parceiro na mesma sessão | Alta |
| RF04.3 | Favoritos mútuos devem ter +40% chance de pareamento | Alta |
| RF04.4 | Favoritos unilaterais devem ter +30% chance de pareamento | Alta |
| RF04.5 | Sistema deve priorizar mesmo nível de proficiência | Alta |
| RF04.6 | Sistema deve aceitar nível adjacente se não houver mesmo nível | Média |
| RF04.7 | Se número ímpar de usuários, criar sala de 3 | Média |
| RF04.8 | Sistema deve notificar via WebSocket quando match for encontrado | Alta |
| RF04.9 | Usuário que entra no meio da sessão entra no próximo ciclo | Alta |

---

### RF05 - Sessão de Vídeo
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF05.1 | Vídeo-chamada 1x1 ou 1x1x1 (3 pessoas) via LiveKit | Alta |
| RF05.2 | Timer de 10 minutos visível durante conversa | Alta |
| RF05.3 | Aviso com 1 minuto restante | Alta |
| RF05.4 | Encerramento automático ao fim do timer | Alta |
| RF05.5 | Tópico de conversa visível acima do vídeo | Alta |
| RF05.6 | Usuário deve poder mutear microfone | Alta |
| RF05.7 | Usuário deve poder desligar câmera | Alta |
| RF05.8 | Usuário deve poder sair da conversa antecipadamente | Alta |
| RF05.9 | Chat de texto auxiliar | Média |
| RF05.10 | Reconexão automática em caso de queda | Média |

---

### RF06 - Rotação e Intervalo
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF06.1 | Após cada conversa de 10 min, iniciar intervalo de 30s | Alta |
| RF06.2 | Durante intervalo, IA deve gerar tópico de conversa | Alta |
| RF06.3 | Tópico deve ser exibido durante o intervalo | Alta |
| RF06.4 | Exibir contador de conversas (ex: "3 de 6") | Alta |
| RF06.5 | Após intervalo, iniciar automaticamente nova conversa | Alta |
| RF06.6 | Usuário pode sair da sessão durante intervalo | Alta |
| RF06.7 | Sessão completa = 6 conversas (aproximadamente 1h) | Alta |

---

### RF07 - Avaliação Pós-Conversa
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF07.1 | Após cada conversa, exibir tela de avaliação | Alta |
| RF07.2 | Usuário deve avaliar parceiro (1-5 estrelas) | Alta |
| RF07.3 | Usuário deve responder "Quer conversar novamente?" (Sim/Não) | Alta |
| RF07.4 | Se ambos responderem Sim, viram favoritos automaticamente | Alta |
| RF07.5 | Feedback escrito opcional | Baixa |
| RF07.6 | Sistema de report para comportamento inadequado | Alta |
| RF07.7 | Avaliações devem ser anônimas | Alta |
| RF07.8 | Sistema deve calcular média de avaliações por usuário | Média |

---

### RF08 - Sistema de Favoritos
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF08.1 | Favoritos são criados automaticamente por "quero conversar novamente" | Alta |
| RF08.2 | Usuário pode ver lista de favoritos | Alta |
| RF08.3 | Usuário pode remover favoritos manualmente | Média |
| RF08.4 | Sistema deve identificar favoritos mútuos | Alta |
| RF08.5 | Favoritos mútuos têm +40% chance no matching | Alta |
| RF08.6 | Favoritos unilaterais têm +30% chance no matching | Alta |

---

### RF09 - Sistema de Créditos
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF09.1 | Dois tipos de crédito: Sessão e Conversa | Alta |
| RF09.2 | 1 crédito de sessão = 1 sessão completa (até 6 conversas) | Alta |
| RF09.3 | 1 crédito de conversa = 1 conversa de 10 min | Alta |
| RF09.4 | Usuário escolhe qual tipo de crédito usar ao entrar | Alta |
| RF09.5 | Compra avulsa: 1 sessão ou 1 conversa | Alta |
| RF09.6 | Compra em pacotes com desconto | Alta |
| RF09.7 | Crédito de sessão debitado ao entrar na sessão | Alta |
| RF09.8 | Crédito de conversa debitado ao completar conversa | Alta |
| RF09.9 | Se sair antes, não cobra conversas não realizadas | Alta |
| RF09.10 | Exibir saldo de créditos no lobby | Alta |

---

### RF10 - Transcrição (Opcional)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF10.1 | Transcrição é opcional e custa créditos extras | Alta |
| RF10.2 | Usuário deve optar por transcrever antes da sessão | Alta |
| RF10.3 | Transcrição via Deepgram (suporta EN/ES) | Alta |
| RF10.4 | Identificação de quem está falando | Média |
| RF10.5 | Armazenamento seguro das transcrições | Alta |
| RF10.6 | Usuário pode acessar transcrições no histórico | Média |

---

### RF11 - Análise de IA (Opcional)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF11.1 | Análise de IA é opcional e custa créditos extras | Alta |
| RF11.2 | Requer transcrição ativa para funcionar | Alta |
| RF11.3 | Análise inclui correções gramaticais | Alta |
| RF11.4 | Análise inclui sugestões de vocabulário | Alta |
| RF11.5 | Análise inclui pontuação de fluência (1-10) | Média |
| RF11.6 | Análise inclui dicas personalizadas | Média |
| RF11.7 | Processamento assíncrono após sessão | Alta |
| RF11.8 | Notificar quando análise estiver pronta | Média |

---

### RF12 - Tópicos de Conversa (IA)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF12.1 | IA deve gerar tópico durante intervalo de 30s | Alta |
| RF12.2 | Tópico deve ser no idioma de prática | Alta |
| RF12.3 | Categorias de tópicos configuráveis pelo admin | Alta |
| RF12.4 | Categorias: Viagens, Tecnologia, Cultura, Negócios, Cotidiano, Hipotéticos | Alta |
| RF12.5 | Tópico exibido no intervalo e durante conversa | Alta |
| RF12.6 | Tópico é sugestão, usuários podem ignorar | - |
| RF12.7 | Evitar repetição de tópicos recentes | Média |

---

### RF13 - Painel Administrativo
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF13.1 | 3 níveis de admin: Super Admin, Admin Pagamento, Moderador | Alta |
| RF13.2 | Super Admin pode criar outros admins | Alta |
| RF13.3 | Admin pode ver lista de todos usuários | Alta |
| RF13.4 | Admin pode ver dados principais do usuário | Alta |
| RF13.5 | Admin pode remover usuário por email | Alta |
| RF13.6 | Admin pode ver sessões ativas | Alta |
| RF13.7 | Admin pode ver total de usuários ativos | Alta |
| RF13.8 | Admin pode ver total de sessões | Alta |
| RF13.9 | Admin pode configurar períodos (CRUD) | Alta |
| RF13.10 | Admin pode habilitar/desabilitar sessão | Alta |
| RF13.11 | Admin pode limpar fila de espera | Média |
| RF13.12 | Admin Pagamento gerencia parte financeira | Alta |
| RF13.13 | Moderador NÃO acessa parte financeira | Alta |

---

### RF14 - Pagamentos (Stripe)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF14.1 | Integração com Stripe para pagamentos | Alta |
| RF14.2 | Compra de créditos avulsos | Alta |
| RF14.3 | Compra de pacotes de créditos | Alta |
| RF14.4 | Histórico de compras do usuário | Média |
| RF14.5 | Admin Pagamento pode ver relatórios financeiros | Alta |
| RF14.6 | Admin Pagamento pode configurar preços | Alta |
| RF14.7 | Webhook para confirmar pagamentos | Alta |
| RF14.8 | Tratamento de pagamentos falhados | Alta |

---

### RF15 - Dashboard/Histórico
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF15.1 | Histórico de sessões participadas | Alta |
| RF15.2 | Histórico de conversas por sessão | Alta |
| RF15.3 | Acesso a transcrições (se compradas) | Média |
| RF15.4 | Acesso a análises de IA (se compradas) | Média |
| RF15.5 | Estatísticas detalhadas de progresso | Média |
| RF15.6 | Gráfico de evolução (se tiver análises) | Baixa |

---

### RF16 - Gamificação (Última prioridade)
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF16.1 | Sistema de XP por ações | Baixa |
| RF16.2 | Níveis de usuário (Bronze → Diamante) | Baixa |
| RF16.3 | Badges por conquistas | Baixa |
| RF16.4 | Streaks de dias consecutivos | Baixa |
| RF16.5 | Ranking semanal/mensal (opt-in) | Baixa |

---

## Requisitos Não-Funcionais (RNF)

### RNF01 - Performance
| ID | Descrição | Métrica |
|----|-----------|---------|
| RNF01.1 | Tempo de matching | < 30s para 95% dos casos |
| RNF01.2 | Latência de vídeo | < 200ms |
| RNF01.3 | Tempo de carregamento inicial | < 3s |
| RNF01.4 | Tempo de resposta da API | < 500ms (p95) |
| RNF01.5 | Geração de tópico pela IA | < 5s |
| RNF01.6 | Usuários simultâneos suportados | Máximo que servidor aguentar |

### RNF02 - Segurança
| ID | Descrição |
|----|-----------|
| RNF02.1 | Todas as comunicações devem usar HTTPS/WSS |
| RNF02.2 | Tokens JWT devem expirar em 24h |
| RNF02.3 | Refresh tokens devem expirar em 7 dias |
| RNF02.4 | Senhas de serviços nunca expostas no frontend |
| RNF02.5 | Rate limiting: 100 req/min por usuário |
| RNF02.6 | Proteção contra CSRF em todas as rotas |
| RNF02.7 | Headers de segurança (CSP, X-Frame-Options, etc.) |
| RNF02.8 | Dados de pagamento via Stripe (não armazenar cartões) |

### RNF03 - Disponibilidade
| ID | Descrição | Métrica |
|----|-----------|---------|
| RNF03.1 | Uptime do sistema | > 99% |
| RNF03.2 | Tempo de recuperação de falha | < 5min |
| RNF03.3 | Reconexão automática de WebSocket | < 5s |
| RNF03.4 | Backup de dados | Diário |

### RNF04 - Privacidade (LGPD)
| ID | Descrição |
|----|-----------|
| RNF04.1 | Consentimento explícito para gravação de áudio |
| RNF04.2 | Opção de não gravar (sessão sem transcrição) |
| RNF04.3 | Usuário pode solicitar exclusão de todos os dados |
| RNF04.4 | Transcrições armazenadas com criptografia |
| RNF04.5 | Política de privacidade clara e acessível |

---

## Matriz de Priorização (MoSCoW)

### Must Have (MVP)
- RF01 (Autenticação)
- RF02 (Lobby com estatísticas)
- RF03 (Sessões por admin)
- RF04 (Matching)
- RF05 (Vídeo)
- RF06 (Rotação + Intervalo)
- RF07 (Avaliação)
- RF09 (Créditos básico)
- RF12 (Tópicos IA)
- RF13 (Admin básico)

### Should Have
- RF08 (Favoritos)
- RF14 (Pagamentos Stripe)
- RF15 (Dashboard)
- RF10 (Transcrição opcional)

### Could Have
- RF11 (Análise IA)
- RF16 (Gamificação)

### Won't Have (this release)
- Agendamento pelo usuário
- App mobile nativo
- Mais idiomas além de EN/ES
