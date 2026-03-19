import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import {
    Container, Paper, TextField, Button, Typography, Box, Alert, CircularProgress,MenuItem
} from '@mui/material'
import { register } from '../../store/slices/authSlices'

const Register = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { loading, error } = useSelector((state) => state.auth)

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: 'O', // default to Other
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.password !== formData.password2) {
            alert("Passwords don't match")
            return
        }
        const result = await dispatch(register(formData))
        if (!result.error) {
            navigate('/')
        }
    }

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        Employee Registration
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {typeof error === 'string' ? error : 'Registration failed'}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Confirm Password"
                            type="password"
                            name="password2"
                            value={formData.password2}
                            onChange={handleChange}
                            required
                        />
                        <TextField fullWidth margin="normal" label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
                        <TextField fullWidth margin="normal" label="Address" name="address" value={formData.address} onChange={handleChange} required multiline rows={2} />
                        <TextField fullWidth margin="normal" label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
                        <TextField select fullWidth margin="normal" label="Gender" name="gender" value={formData.gender} onChange={handleChange} required>
                            <MenuItem value="M">Male</MenuItem>
                            <MenuItem value="F">Female</MenuItem>
                            <MenuItem value="O">Other</MenuItem>
                        </TextField>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Register'}
                        </Button>
                        <Box textAlign="center">
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    Already have an account? Login
                                </Typography>
                            </Link>
                        </Box>
                    </form>
                </Paper>
            </Box>
        </Container>
    )
}

export default Register