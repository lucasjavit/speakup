package com.speakup.application.user;

import com.speakup.application.user.dto.CompleteProfileRequest;
import com.speakup.application.user.dto.UserResponse;
import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = User.builder()
                .email("test@example.com")
                .name("Test User")
                .provider(AuthProvider.GOOGLE)
                .providerId("google-123")
                .build();
    }

    @Nested
    @DisplayName("getUser")
    class GetUser {

        @Test
        @DisplayName("should return user when found")
        void shouldReturnUserWhenFound() {
            // Arrange
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

            // Act
            UserResponse response = userService.getUser(userId);

            // Assert
            assertThat(response.email()).isEqualTo("test@example.com");
            assertThat(response.name()).isEqualTo("Test User");
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.getUser(userId))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining(userId.toString());
        }
    }

    @Nested
    @DisplayName("completeProfile")
    class CompleteProfile {

        @Test
        @DisplayName("should complete profile successfully")
        void shouldCompleteProfileSuccessfully() {
            // Arrange
            CompleteProfileRequest request = new CompleteProfileRequest(
                    Language.PORTUGUESE,
                    Language.ENGLISH,
                    ProficiencyLevel.INTERMEDIATE,
                    "America/Sao_Paulo"
            );

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            UserResponse response = userService.completeProfile(userId, request);

            // Assert
            assertThat(response.nativeLanguage()).isEqualTo(Language.PORTUGUESE);
            assertThat(response.targetLanguage()).isEqualTo(Language.ENGLISH);
            assertThat(response.proficiencyLevel()).isEqualTo(ProficiencyLevel.INTERMEDIATE);
            assertThat(response.profileCompleted()).isTrue();

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            CompleteProfileRequest request = new CompleteProfileRequest(
                    Language.PORTUGUESE,
                    Language.ENGLISH,
                    ProficiencyLevel.INTERMEDIATE,
                    "America/Sao_Paulo"
            );

            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.completeProfile(userId, request))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deactivateUser")
    class DeactivateUser {

        @Test
        @DisplayName("should deactivate user successfully")
        void shouldDeactivateUserSuccessfully() {
            // Arrange
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            userService.deactivateUser(userId);

            // Assert
            assertThat(testUser.isActive()).isFalse();
            verify(userRepository).save(testUser);
        }
    }
}
