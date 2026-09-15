import { Box, Container } from '@mui/material';
import { SignInForm } from 'features/auth';

export default function SignInPage() {
  return (
    <Container maxWidth="xs">
      <Box sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 10 } }}>
        <SignInForm />
      </Box>
    </Container>
  );
}
