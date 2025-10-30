from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import pytz
import logging
from database import Session, User, ResearchPaper, Report

research_bp = Blueprint('research', __name__, url_prefix='/api/research')
logger = logging.getLogger(__name__)

IST = pytz.timezone('Asia/Kolkata')

@research_bp.route('/papers', methods=['GET'])
@jwt_required()
def get_papers():
    session = Session()
    try:
        status_filter = request.args.get('status', None)
        category_filter = request.args.get('category', None)

        query = session.query(ResearchPaper).filter_by(is_active=True)

        if status_filter:
            query = query.filter_by(status=status_filter)

        if category_filter:
            query = query.filter_by(category=category_filter)

        papers = query.order_by(ResearchPaper.created_at.desc()).all()

        papers_data = []
        for paper in papers:
            papers_data.append({
                "id": paper.id,
                "title": paper.title,
                "abstract": paper.abstract,
                "authors": paper.authors,
                "category": paper.category,
                "keywords": paper.keywords,
                "status": paper.status,
                "paper_url": paper.paper_url,
                "doi": paper.doi,
                "publication_date": paper.publication_date.isoformat() if paper.publication_date else None,
                "owner_id": paper.owner_id,
                "owner": {
                    "id": paper.owner.id,
                    "username": paper.owner.username,
                    "full_name": paper.owner.full_name,
                    "avatar_url": paper.owner.avatar_url
                },
                "created_at": paper.created_at.isoformat(),
                "updated_at": paper.updated_at.isoformat()
            })

        return jsonify(papers_data), 200

    except Exception as e:
        logger.error(f"Failed to fetch research papers: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to fetch research papers"}), 500
    finally:
        session.close()

@research_bp.route('/papers/<int:paper_id>', methods=['GET'])
@jwt_required()
def get_paper(paper_id):
    session = Session()
    try:
        paper = session.query(ResearchPaper).filter_by(id=paper_id, is_active=True).first()

        if not paper:
            return jsonify({"error": "Research paper not found"}), 404

        paper_data = {
            "id": paper.id,
            "title": paper.title,
            "abstract": paper.abstract,
            "authors": paper.authors,
            "category": paper.category,
            "keywords": paper.keywords,
            "status": paper.status,
            "paper_url": paper.paper_url,
            "doi": paper.doi,
            "publication_date": paper.publication_date.isoformat() if paper.publication_date else None,
            "owner_id": paper.owner_id,
            "owner": {
                "id": paper.owner.id,
                "username": paper.owner.username,
                "full_name": paper.owner.full_name,
                "avatar_url": paper.owner.avatar_url,
                "email": paper.owner.email
            },
            "created_at": paper.created_at.isoformat(),
            "updated_at": paper.updated_at.isoformat()
        }

        return jsonify(paper_data), 200

    except Exception as e:
        logger.error(f"Failed to fetch research paper: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to fetch research paper"}), 500
    finally:
        session.close()

@research_bp.route('/papers', methods=['POST'])
@jwt_required()
def create_paper():
    session = Session()
    try:
        current_user_id = get_jwt_identity()
        user = session.query(User).filter_by(username=current_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        title = data.get('title', '').strip()
        abstract = data.get('abstract', '').strip()
        authors = data.get('authors', '').strip()

        if not title or not abstract or not authors:
            return jsonify({"error": "Title, abstract, and authors are required"}), 400

        paper = ResearchPaper(
            title=title,
            abstract=abstract,
            authors=authors,
            category=data.get('category', '').strip(),
            keywords=data.get('keywords', '').strip(),
            status='abstract',
            owner_id=user.id,
            created_at=datetime.now(IST)
        )

        session.add(paper)
        session.commit()

        logger.info(f"Research paper created: {title} by user {user.username}")

        return jsonify({
            "message": "Research paper created successfully",
            "paper_id": paper.id
        }), 201

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to create research paper: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to create research paper"}), 500
    finally:
        session.close()

@research_bp.route('/papers/<int:paper_id>', methods=['PUT'])
@jwt_required()
def update_paper(paper_id):
    session = Session()
    try:
        current_user_id = get_jwt_identity()
        user = session.query(User).filter_by(username=current_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        paper = session.query(ResearchPaper).filter_by(id=paper_id, is_active=True).first()

        if not paper:
            return jsonify({"error": "Research paper not found"}), 404

        if paper.owner_id != user.id and not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        if 'title' in data:
            paper.title = data['title'].strip()
        if 'abstract' in data:
            paper.abstract = data['abstract'].strip()
        if 'authors' in data:
            paper.authors = data['authors'].strip()
        if 'category' in data:
            paper.category = data['category'].strip()
        if 'keywords' in data:
            paper.keywords = data['keywords'].strip()
        if 'status' in data:
            paper.status = data['status']
        if 'paper_url' in data:
            paper.paper_url = data['paper_url'].strip()
        if 'doi' in data:
            paper.doi = data['doi'].strip()
        if 'publication_date' in data and data['publication_date']:
            paper.publication_date = datetime.fromisoformat(data['publication_date'].replace('Z', '+00:00'))

        paper.updated_at = datetime.now(IST)
        session.commit()

        logger.info(f"Research paper updated: {paper.title} by user {user.username}")

        return jsonify({"message": "Research paper updated successfully"}), 200

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to update research paper: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to update research paper"}), 500
    finally:
        session.close()

@research_bp.route('/papers/<int:paper_id>', methods=['DELETE'])
@jwt_required()
def delete_paper(paper_id):
    session = Session()
    try:
        current_user_id = get_jwt_identity()
        user = session.query(User).filter_by(username=current_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        paper = session.query(ResearchPaper).filter_by(id=paper_id, is_active=True).first()

        if not paper:
            return jsonify({"error": "Research paper not found"}), 404

        if paper.owner_id != user.id and not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        paper.is_active = False
        paper.updated_at = datetime.now(IST)
        session.commit()

        logger.info(f"Research paper deleted: {paper.title} by user {user.username}")

        return jsonify({"message": "Research paper deleted successfully"}), 200

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to delete research paper: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to delete research paper"}), 500
    finally:
        session.close()

@research_bp.route('/papers/<int:paper_id>/publish', methods=['POST'])
@jwt_required()
def publish_paper(paper_id):
    session = Session()
    try:
        current_user_id = get_jwt_identity()
        user = session.query(User).filter_by(username=current_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        paper = session.query(ResearchPaper).filter_by(id=paper_id, is_active=True).first()

        if not paper:
            return jsonify({"error": "Research paper not found"}), 404

        if paper.owner_id != user.id and not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        paper_url = data.get('paper_url', '').strip()
        doi = data.get('doi', '').strip()

        if not paper_url:
            return jsonify({"error": "Paper URL is required for publishing"}), 400

        paper.status = 'published'
        paper.paper_url = paper_url
        if doi:
            paper.doi = doi
        paper.publication_date = datetime.now(IST)
        paper.updated_at = datetime.now(IST)
        session.commit()

        logger.info(f"Research paper published: {paper.title} by user {user.username}")

        return jsonify({"message": "Research paper published successfully"}), 200

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to publish research paper: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to publish research paper"}), 500
    finally:
        session.close()

@research_bp.route('/my-papers', methods=['GET'])
@jwt_required()
def get_my_papers():
    session = Session()
    try:
        current_user_id = get_jwt_identity()
        user = session.query(User).filter_by(username=current_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        papers = session.query(ResearchPaper).filter_by(owner_id=user.id, is_active=True).order_by(ResearchPaper.created_at.desc()).all()

        papers_data = []
        for paper in papers:
            papers_data.append({
                "id": paper.id,
                "title": paper.title,
                "abstract": paper.abstract,
                "authors": paper.authors,
                "category": paper.category,
                "keywords": paper.keywords,
                "status": paper.status,
                "paper_url": paper.paper_url,
                "doi": paper.doi,
                "publication_date": paper.publication_date.isoformat() if paper.publication_date else None,
                "created_at": paper.created_at.isoformat(),
                "updated_at": paper.updated_at.isoformat()
            })

        return jsonify(papers_data), 200

    except Exception as e:
        logger.error(f"Failed to fetch user's research papers: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to fetch research papers"}), 500
    finally:
        session.close()

@research_bp.route('/papers/<int:paper_id>/report', methods=['POST'])
@jwt_required()
def report_paper(paper_id):
    session = Session()
    try:
        current_user_id = get_jwt_identity()
        user = session.query(User).filter_by(username=current_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        paper = session.query(ResearchPaper).filter_by(id=paper_id).first()
        if not paper:
            return jsonify({"error": "Research paper not found"}), 404

        if paper.owner_id == user.id:
            return jsonify({"error": "You cannot report your own research paper"}), 400

        existing_report = session.query(Report).filter_by(
            reporter_id=user.id,
            report_type='research_paper',
            target_id=paper_id
        ).first()

        if existing_report:
            return jsonify({"error": "You have already reported this research paper"}), 400

        data = request.get_json()
        reason = data.get('reason', '').strip()

        if not reason:
            return jsonify({"error": "Reason is required"}), 400

        report = Report(
            reporter_id=user.id,
            report_type='research_paper',
            target_id=paper_id,
            reason=reason
        )

        session.add(report)
        session.commit()

        logger.info(f"Research paper reported: {paper.title} by user {user.username}")

        return jsonify({"message": "Research paper reported successfully"}), 201

    except Exception as e:
        session.rollback()
        logger.error(f"Failed to report research paper: {type(e).__name__}: {str(e)}")
        return jsonify({"error": "Failed to report research paper"}), 500
    finally:
        session.close()
