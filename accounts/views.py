from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer

class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'id': user.id, 
            'username': user.username, 
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginAPIView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        return Response({
            'id': user.id,
            'username': user.username,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
