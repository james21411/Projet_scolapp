'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/icons/logo"
import { login } from '@/app/login/actions'
import { useToast } from "@/hooks/use-toast"
import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { getSchoolInfo, type SchoolInfo } from "@/services/schoolInfoService"

const formSchema = z.object({
  username: z.string().min(1, { message: "L'identifiant est requis." }),
  password: z.string().min(1, { message: "Le mot de passe ne peut pas être vide." }),
})

export default function LoginPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

    useEffect(() => {
        getSchoolInfo().then(setSchoolInfo);
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const result = await login(values);
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erreur de connexion",
                    description: result.error,
                });
            } else if (result.success) {
                // Redirection côté client après connexion réussie
                window.location.href = '/dashboard';
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erreur inattendue",
                description: "Une erreur est survenue. Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="flex items-center justify-center min-h-screen bg-muted/50">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <Logo className="mx-auto mb-4 h-16 w-16" logoUrl={schoolInfo?.logoUrl} />
                    <CardTitle className="text-2xl">Bienvenue sur {schoolInfo?.name || 'ScolApp Visuel'}</CardTitle>
                    <CardDescription>Entrez votre identifiant et mot de passe pour vous connecter.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Identifiant</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: ADMIN-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mot de passe</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Se connecter
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    )
}
