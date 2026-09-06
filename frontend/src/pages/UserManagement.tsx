import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type UserRole = "USER" | "MODERATOR" | "ADMIN";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  _count: { listings: number };
}

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuário",
  MODERATOR: "Moderador",
  ADMIN: "Administrador",
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  useEffect(() => {
    api
      .get<ManagedUser[]>("/admin/users")
      .then((response) => setUsers(response.data))
      .catch((err) =>
        setError(err.response?.data?.error || "Falha ao carregar os usuários.")
      )
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (managedUser: ManagedUser, role: UserRole) => {
    if (managedUser.role === role) return;
    setUpdatingUserId(managedUser.id);
    setError("");
    setSuccess("");
    try {
      const response = await api.patch<ManagedUser>(
        `/admin/users/${managedUser.id}/role`,
        { role }
      );
      setUsers((current) =>
        current.map((item) =>
          item.id === managedUser.id ? response.data : item
        )
      );
      setSuccess(`${managedUser.name} agora possui o perfil ${ROLE_LABELS[role]}.`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha ao alterar o perfil.");
    } finally {
      setUpdatingUserId("");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Controle de usuários
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Consulte os usuários cadastrados e defina seus perfis de acesso.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando usuários...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Publicações</th>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((managedUser) => {
                const isCurrentUser = managedUser.id === user?.id;
                return (
                  <tr key={managedUser.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {managedUser.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            (você)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{managedUser.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {managedUser._count.listings}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {new Intl.DateTimeFormat("pt-BR").format(
                        new Date(managedUser.createdAt)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={managedUser.role}
                        onChange={(event) =>
                          void changeRole(
                            managedUser,
                            event.target.value as UserRole
                          )
                        }
                        disabled={
                          isCurrentUser || updatingUserId === managedUser.id
                        }
                        className="field min-w-36 disabled:cursor-not-allowed disabled:bg-gray-100"
                        aria-label={`Perfil de ${managedUser.name}`}
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
