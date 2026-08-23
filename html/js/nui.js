export const preview = typeof window.GetParentResourceName !== 'function';

export function resourceName() {
    try {
        return GetParentResourceName();
    } catch {
        return 'djfivem_gambling';
    }
}

export async function post(name, payload) {
    if (preview) {
        return null;
    }

    const response = await fetch(`https://${resourceName()}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload || {})
    });

    try {
        return await response.json();
    } catch {
        return { ok: false, error: 'Bad NUI response' };
    }
}
