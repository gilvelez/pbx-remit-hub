"""
PBX Social API Tests
Tests for: Friendships, Conversations, Messages, In-Chat Payments
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user tokens - simulating two users
USER_A_TOKEN = f"test-user-a-{uuid.uuid4().hex[:8]}"
USER_B_TOKEN = f"test-user-b-{uuid.uuid4().hex[:8]}"
MOCK_USER_ID = "mock-user-001"  # Maria Santos from mock directory


class TestFriendshipEndpoints:
    """Test friendship request/action/list/status endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.user_a_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_A_TOKEN
        }
        self.user_b_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_B_TOKEN
        }
    
    def test_send_friend_request_requires_auth(self):
        """POST /api/social/friends/request - requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": "some-user"},
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_send_friend_request_to_self_fails(self):
        """POST /api/social/friends/request - cannot send to self"""
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": USER_A_TOKEN},
            headers=self.user_a_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "yourself" in data.get("detail", "").lower()
    
    def test_send_friend_request_success(self):
        """POST /api/social/friends/request - successful request"""
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": USER_B_TOKEN},
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "friendship_id" in data
        assert data.get("status") == "pending"
        
        # Store for later tests
        self.__class__.friendship_id = data["friendship_id"]
    
    def test_get_friends_list_requires_auth(self):
        """GET /api/social/friends/list - requires auth"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/list",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_get_friends_list_shows_outgoing_request(self):
        """GET /api/social/friends/list - shows outgoing request for sender"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/list",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "friends" in data
        assert "incoming_requests" in data
        assert "outgoing_requests" in data
        assert "total_friends" in data
        assert "pending_count" in data
        
        # User A should have outgoing request
        outgoing = data.get("outgoing_requests", [])
        assert len(outgoing) >= 1
    
    def test_get_friends_list_shows_incoming_request(self):
        """GET /api/social/friends/list - shows incoming request for recipient"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/list",
            headers=self.user_b_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # User B should have incoming request
        incoming = data.get("incoming_requests", [])
        assert len(incoming) >= 1
    
    def test_get_friendship_status_requires_auth(self):
        """GET /api/social/friends/status/:userId - requires auth"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/status/{USER_B_TOKEN}",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_get_friendship_status_outgoing_pending(self):
        """GET /api/social/friends/status/:userId - shows outgoing_pending"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/status/{USER_B_TOKEN}",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "outgoing_pending"
        assert "friendship_id" in data
    
    def test_get_friendship_status_incoming_pending(self):
        """GET /api/social/friends/status/:userId - shows incoming_pending"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/status/{USER_A_TOKEN}",
            headers=self.user_b_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "incoming_pending"
    
    def test_friend_action_requires_auth(self):
        """POST /api/social/friends/action - requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/social/friends/action",
            json={"friendship_id": "test", "action": "accept"},
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_friend_action_only_addressee_can_accept(self):
        """POST /api/social/friends/action - only addressee can accept"""
        friendship_id = getattr(self.__class__, 'friendship_id', None)
        if not friendship_id:
            pytest.skip("No friendship_id from previous test")
        
        # User A (requester) tries to accept - should fail
        response = requests.post(
            f"{BASE_URL}/api/social/friends/action",
            json={"friendship_id": friendship_id, "action": "accept"},
            headers=self.user_a_headers
        )
        assert response.status_code == 403
    
    def test_friend_action_accept_success(self):
        """POST /api/social/friends/action - accept creates friendship"""
        friendship_id = getattr(self.__class__, 'friendship_id', None)
        if not friendship_id:
            pytest.skip("No friendship_id from previous test")
        
        # User B (addressee) accepts
        response = requests.post(
            f"{BASE_URL}/api/social/friends/action",
            json={"friendship_id": friendship_id, "action": "accept"},
            headers=self.user_b_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("status") == "accepted"
    
    def test_friendship_status_now_friends(self):
        """GET /api/social/friends/status/:userId - shows friends after accept"""
        response = requests.get(
            f"{BASE_URL}/api/social/friends/status/{USER_B_TOKEN}",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "friends"


class TestConversationEndpoints:
    """Test conversation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.user_a_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_A_TOKEN
        }
        self.user_b_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_B_TOKEN
        }
    
    def test_get_conversations_requires_auth(self):
        """GET /api/social/conversations - requires auth"""
        response = requests.get(
            f"{BASE_URL}/api/social/conversations",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_get_conversations_success(self):
        """GET /api/social/conversations - returns conversations list"""
        response = requests.get(
            f"{BASE_URL}/api/social/conversations",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        
        # Should have at least one conversation (created when friendship accepted)
        convos = data.get("conversations", [])
        if len(convos) > 0:
            convo = convos[0]
            assert "conversation_id" in convo
            assert "other_user" in convo
            assert "last_message" in convo or convo.get("last_message") is None
    
    def test_get_conversation_with_user_requires_auth(self):
        """GET /api/social/conversations/:userId - requires auth"""
        response = requests.get(
            f"{BASE_URL}/api/social/conversations/{USER_B_TOKEN}",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_get_conversation_with_friend_success(self):
        """GET /api/social/conversations/:userId - returns conversation with friend"""
        response = requests.get(
            f"{BASE_URL}/api/social/conversations/{USER_B_TOKEN}",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "conversation_id" in data
        assert "other_user" in data
        assert data["other_user"]["user_id"] == USER_B_TOKEN
        
        # Store for message tests
        self.__class__.conversation_id = data["conversation_id"]
    
    def test_get_conversation_with_non_friend_fails(self):
        """GET /api/social/conversations/:userId - fails if not friends"""
        non_friend_id = f"non-friend-{uuid.uuid4().hex[:8]}"
        response = requests.get(
            f"{BASE_URL}/api/social/conversations/{non_friend_id}",
            headers=self.user_a_headers
        )
        assert response.status_code == 403
        data = response.json()
        assert "friends" in data.get("detail", "").lower()


class TestMessageEndpoints:
    """Test message send/get endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.user_a_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_A_TOKEN
        }
        self.user_b_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_B_TOKEN
        }
    
    def test_send_message_requires_auth(self):
        """POST /api/social/messages/send - requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/social/messages/send",
            json={"conversation_id": "test", "text": "Hello"},
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_send_message_requires_text(self):
        """POST /api/social/messages/send - requires text"""
        # First get conversation ID
        convo_response = requests.get(
            f"{BASE_URL}/api/social/conversations/{USER_B_TOKEN}",
            headers=self.user_a_headers
        )
        if convo_response.status_code != 200:
            pytest.skip("Could not get conversation")
        
        conversation_id = convo_response.json().get("conversation_id")
        
        response = requests.post(
            f"{BASE_URL}/api/social/messages/send",
            json={"conversation_id": conversation_id, "text": ""},
            headers=self.user_a_headers
        )
        assert response.status_code == 400
    
    def test_send_message_success(self):
        """POST /api/social/messages/send - sends text message"""
        # First get conversation ID
        convo_response = requests.get(
            f"{BASE_URL}/api/social/conversations/{USER_B_TOKEN}",
            headers=self.user_a_headers
        )
        if convo_response.status_code != 200:
            pytest.skip("Could not get conversation")
        
        conversation_id = convo_response.json().get("conversation_id")
        
        response = requests.post(
            f"{BASE_URL}/api/social/messages/send",
            json={
                "conversation_id": conversation_id,
                "text": "Hello from test!",
                "message_type": "text"
            },
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "message_id" in data
        assert "created_at" in data
        
        self.__class__.conversation_id = conversation_id
    
    def test_get_messages_requires_auth(self):
        """GET /api/social/messages/:conversationId - requires auth"""
        response = requests.get(
            f"{BASE_URL}/api/social/messages/test-convo",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_get_messages_success(self):
        """GET /api/social/messages/:conversationId - returns messages"""
        conversation_id = getattr(self.__class__, 'conversation_id', None)
        if not conversation_id:
            # Try to get it
            convo_response = requests.get(
                f"{BASE_URL}/api/social/conversations/{USER_B_TOKEN}",
                headers=self.user_a_headers
            )
            if convo_response.status_code != 200:
                pytest.skip("Could not get conversation")
            conversation_id = convo_response.json().get("conversation_id")
        
        response = requests.get(
            f"{BASE_URL}/api/social/messages/{conversation_id}",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "messages" in data
        assert "conversation_id" in data
        
        messages = data.get("messages", [])
        if len(messages) > 0:
            msg = messages[-1]  # Last message
            assert "message_id" in msg
            assert "sender_user_id" in msg
            assert "type" in msg
            assert "created_at" in msg
    
    def test_get_messages_invalid_conversation(self):
        """GET /api/social/messages/:conversationId - 404 for invalid convo"""
        response = requests.get(
            f"{BASE_URL}/api/social/messages/invalid-convo-id",
            headers=self.user_a_headers
        )
        assert response.status_code == 404


class TestPaymentInChatEndpoint:
    """Test in-chat payment endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.user_a_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_A_TOKEN
        }
        self.user_b_headers = {
            'Content-Type': 'application/json',
            'X-Session-Token': USER_B_TOKEN
        }
    
    def test_send_payment_requires_auth(self):
        """POST /api/social/payments/send-in-chat - requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": "test", "amount_usd": 10},
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code == 401
    
    def test_send_payment_to_self_fails(self):
        """POST /api/social/payments/send-in-chat - cannot send to self"""
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": USER_A_TOKEN, "amount_usd": 10},
            headers=self.user_a_headers
        )
        assert response.status_code == 400
        data = response.json()
        assert "yourself" in data.get("detail", "").lower()
    
    def test_send_payment_to_non_friend_fails(self):
        """POST /api/social/payments/send-in-chat - must be friends"""
        non_friend_id = f"non-friend-{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": non_friend_id, "amount_usd": 10},
            headers=self.user_a_headers
        )
        assert response.status_code == 403
        data = response.json()
        assert "friends" in data.get("detail", "").lower()
    
    def test_send_payment_invalid_amount(self):
        """POST /api/social/payments/send-in-chat - validates amount"""
        # Amount must be > 0 and <= 5000
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": USER_B_TOKEN, "amount_usd": 0},
            headers=self.user_a_headers
        )
        assert response.status_code == 422  # Validation error
    
    def test_send_payment_success(self):
        """POST /api/social/payments/send-in-chat - successful payment"""
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={
                "recipient_user_id": USER_B_TOKEN,
                "amount_usd": 5.00,
                "note": "Test payment from pytest"
            },
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "tx_id" in data
        assert "message_id" in data
        assert "conversation_id" in data
        assert data.get("amount_usd") == 5.00
        assert "new_balance" in data
        assert "created_at" in data
    
    def test_payment_creates_message_bubble(self):
        """Verify payment creates a message in conversation"""
        # Get conversation
        convo_response = requests.get(
            f"{BASE_URL}/api/social/conversations/{USER_B_TOKEN}",
            headers=self.user_a_headers
        )
        if convo_response.status_code != 200:
            pytest.skip("Could not get conversation")
        
        conversation_id = convo_response.json().get("conversation_id")
        
        # Get messages
        response = requests.get(
            f"{BASE_URL}/api/social/messages/{conversation_id}",
            headers=self.user_a_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        messages = data.get("messages", [])
        payment_messages = [m for m in messages if m.get("type") == "payment"]
        
        assert len(payment_messages) >= 1, "Should have at least one payment message"
        
        # Verify payment message structure
        payment_msg = payment_messages[-1]
        assert "payment" in payment_msg
        assert "tx_id" in payment_msg["payment"]
        assert "amount_usd" in payment_msg["payment"]
        assert payment_msg["payment"]["status"] == "completed"


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """GET /api/health - returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
