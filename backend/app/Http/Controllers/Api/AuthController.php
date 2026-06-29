<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'mot_de_passe' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['mot_de_passe'], $user->mot_de_passe)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user' => $request->user(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'email' => ['sometimes', 'email', 'unique:user,email,' . $user->id],
            'mot_de_passe_actuel' => ['required_with:nouveau_mot_de_passe', 'string'],
            'nouveau_mot_de_passe' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ];

        $data = $request->validate($rules);

        // Update email if provided
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        // Update password if provided
        if (isset($data['nouveau_mot_de_passe'])) {
            if (! Hash::check($data['mot_de_passe_actuel'], $user->mot_de_passe)) {
                throw ValidationException::withMessages([
                    'mot_de_passe_actuel' => ['Le mot de passe actuel est incorrect.'],
                ]);
            }
            $user->mot_de_passe = $data['nouveau_mot_de_passe'];
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès.',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
    }
}
