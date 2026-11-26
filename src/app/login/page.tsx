'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const router = useRouter();
  const { mode } = useTheme();
  const supabase = createClient();
  const [form] = Form.useForm();

  const handlePasswordLogin = async (values: { email: string; password?: string }) => {
    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const email = values.email.trim();
    const password = values.password || '';

    // Tentar login com senha; se o usuário ainda não existir ou não tiver senha, tentar signUp direto (onboarding ágil)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        // Tenta registrar novo usuário se for primeira vez
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        setErrorMessage(signInError.message);
      }
    } else {
      router.push('/dashboard');
      router.refresh();
    }

    setLoading(false);
  };

  const handleMagicLink = async () => {
    try {
      const values = await form.validateFields(['email']);
      const email = values.email.trim();
      setMagicLinkLoading(true);
      setErrorMessage(null);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setInfoMessage('Link de acesso enviado para o seu e-mail corporativo!');
      }
    } catch {
      // validação do formulário falhou
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'dark' ? '#0a0a0a' : '#f5f5f5',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: '#1677ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 22,
              marginBottom: 12,
            }}
          >
            TM
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>
            TestManager
          </Title>
          <Text type="secondary">
            Gestão ágil de testes e controle de branches
          </Text>
        </div>

        {errorMessage && (
          <Alert
            message="Erro de Autenticação"
            description={errorMessage}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {infoMessage && (
          <Alert
            message="Acesso por E-mail"
            description={infoMessage}
            type="success"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordLogin}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="E-mail Corporativo"
            rules={[
              { required: true, message: 'Por favor, informe seu e-mail corporativo' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="seu.email@empresa.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Senha"
            rules={[
              { required: true, message: 'Por favor, informe sua senha' },
              { min: 6, message: 'A senha deve conter no mínimo 6 caracteres' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Sua senha de acesso"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ marginTop: 8 }}
          >
            Entrar / Cadastrar
          </Button>

          <Divider style={{ margin: '18px 0' }}>ou</Divider>

          <Button
            type="default"
            size="large"
            block
            icon={<ThunderboltOutlined />}
            loading={magicLinkLoading}
            onClick={handleMagicLink}
          >
            Receber Magic Link por E-mail
          </Button>
        </Form>
      </Card>
    </div>
  );
}
