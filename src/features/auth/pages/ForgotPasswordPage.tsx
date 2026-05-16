import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setIsSubmitted(true)
      toast({
        title: 'Email enviado',
        description: `Se o email ${data.email} estiver cadastrado, você receberá um link para redefinir sua senha.`,
      })
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast({
        title: 'Erro',
        description:
          error.message || 'Não foi possível enviar o email de recuperação.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-asplan-primary">
            Recuperação de Senha
          </CardTitle>
          <CardDescription className="text-center">
            {isSubmitted
              ? 'Verifique sua caixa de entrada'
              : 'Digite seu email para receber o link de redefinição'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Enviamos as instruções de recuperação para o seu email. Por
                favor, verifique sua caixa de entrada e a pasta de spam.
              </p>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Voltar para o Login
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu.email@asplan.gov"
                          {...field}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-asplan-primary hover:bg-asplan-deep"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!isSubmitted && (
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              className="text-sm text-muted-foreground"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default ForgotPasswordPage
