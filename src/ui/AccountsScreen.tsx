import { useState } from 'react';
import type { CurrencyCode } from '../domain/types';
import { useStore } from '../state/store';
import { Button, Card, CurrencySelector, ScreenContainer } from './components';

/** Rótulos curtos de exibição por moeda. */
const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  KZ: 'Kz',
  BRL: 'R$',
  EUR: 'EUR',
};

const inputClasses =
  'w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-background placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none';

const fieldLabelClasses =
  'font-label-md text-label-md font-semibold text-on-surface-variant';

/**
 * Tela de gestão de contas: lista, cria, edita e exclui contas (nome + moeda),
 * exibindo mensagens de erro de validação. (Req. 1.1, 1.2, 1.4, 1.5, 1.6, 1.7)
 */
export default function AccountsScreen() {
  const accounts = useStore((state) => state.accounts);
  const addAccount = useStore((state) => state.addAccount);
  const editAccount = useStore((state) => state.editAccount);
  const deleteAccount = useStore((state) => state.deleteAccount);

  const [newName, setNewName] = useState('');
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>('KZ');
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>('KZ');
  const [editError, setEditError] = useState<string | null>(null);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = addAccount(newName, newCurrency);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setNewName('');
    setNewCurrency('KZ');
    setAddError(null);
  }

  function startEditing(id: string, name: string, currency: CurrencyCode) {
    setEditingId(id);
    setEditName(name);
    setEditCurrency(currency);
    setEditError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditError(null);
  }

  function handleSaveEdit(id: string) {
    const result = editAccount(id, { name: editName, currency: editCurrency });
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    setEditingId(null);
    setEditError(null);
  }

  return (
    <ScreenContainer
      title="Contas"
      subtitle="Cadastre as fontes do seu patrimônio."
    >
      {/* Formulário de criação */}
      <Card>
        <form className="flex flex-col gap-stack-lg" onSubmit={handleAdd}>
          <div className="flex flex-col gap-2">
            <label className={fieldLabelClasses} htmlFor="new-account-name">
              Nome da conta
            </label>
            <input
              id="new-account-name"
              className={inputClasses}
              type="text"
              value={newName}
              placeholder="Ex.: Conta BAI"
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={fieldLabelClasses}>Moeda</span>
            <CurrencySelector value={newCurrency} onChange={setNewCurrency} />
          </div>

          {addError && (
            <p className="font-label-md text-label-md text-error" role="alert">
              {addError}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Adicionar conta
          </Button>
        </form>
      </Card>

      {/* Lista de contas */}
      {accounts.length === 0 ? (
        <Card>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Nenhuma conta cadastrada ainda.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-stack-md">
          {accounts.map((account) => (
            <li key={account.id}>
              <Card>
                {editingId === account.id ? (
                  <div className="flex flex-col gap-stack-lg">
                    <div className="flex flex-col gap-2">
                      <label
                        className={fieldLabelClasses}
                        htmlFor={`edit-name-${account.id}`}
                      >
                        Nome da conta
                      </label>
                      <input
                        id={`edit-name-${account.id}`}
                        className={inputClasses}
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className={fieldLabelClasses}>Moeda</span>
                      <CurrencySelector
                        value={editCurrency}
                        onChange={setEditCurrency}
                      />
                    </div>

                    {editError && (
                      <p
                        className="font-label-md text-label-md text-error"
                        role="alert"
                      >
                        {editError}
                      </p>
                    )}

                    <div className="flex gap-stack-md">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveEdit(account.id)}
                      >
                        Salvar
                      </Button>
                      <Button variant="secondary" onClick={cancelEditing}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-xl">
                          account_balance_wallet
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-body-lg text-body-lg font-semibold text-on-background truncate">
                          {account.name}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface-variant">
                          {CURRENCY_LABELS[account.currency]}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-95"
                        aria-label={`Editar ${account.name}`}
                        onClick={() =>
                          startEditing(
                            account.id,
                            account.name,
                            account.currency,
                          )
                        }
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        className="w-10 h-10 flex items-center justify-center rounded-full text-error hover:bg-error-container/40 transition-colors active:scale-95"
                        aria-label={`Excluir ${account.name}`}
                        onClick={() => deleteAccount(account.id)}
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </ScreenContainer>
  );
}
